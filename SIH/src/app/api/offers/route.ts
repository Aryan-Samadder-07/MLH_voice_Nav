import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDistanceBetweenLocations, calculateTransportFee } from "@/lib/logisticsUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lotId = searchParams.get("lotId") || undefined;
  const buyerId = searchParams.get("buyerId") || undefined;

  try {
    let whereClause: any = {};
    if (lotId) whereClause.lotId = lotId;
    if (buyerId) whereClause.buyerId = buyerId;

    const offers = await prisma.buyerOffer.findMany({
      where: whereClause,
      include: {
        buyer: true,
        lot: {
          include: {
            farmer: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error in /api/offers GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offeredPrice, quantity, buyerId, lotId } = body;

    if (!offeredPrice || !quantity || !buyerId || !lotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify lot is still active
    const lot = await prisma.lotListing.findUnique({
      where: { id: lotId }
    });

    if (!lot || lot.status !== "ACTIVE") {
      return NextResponse.json({ error: "Lot is no longer active for bidding" }, { status: 400 });
    }

    const offer = await prisma.buyerOffer.create({
      data: {
        offeredPrice: parseFloat(offeredPrice),
        quantity: parseFloat(quantity),
        buyerId,
        lotId,
        status: "PENDING"
      },
      include: {
        buyer: true
      }
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Error in /api/offers POST:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    let { offerId, status, action, transporterBidId } = body;
    
    // Normalize status/action parameter
    if (!status && action) {
      if (action === "ACCEPT") status = "ACCEPTED";
      if (action === "REJECT") status = "REJECTED";
    }

    if (!offerId || !status || (status !== "ACCEPTED" && status !== "REJECTED")) {
      return NextResponse.json({ error: "Invalid offer status update request" }, { status: 400 });
    }

    // Get the offer with its lot and farmer/buyer relations
    const offer = await prisma.buyerOffer.findUnique({
      where: { id: offerId },
      include: {
        buyer: true,
        lot: {
          include: {
            farmer: true,
            transportJob: {
              include: {
                bids: true
              }
            }
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.lot.status !== "ACTIVE" && status === "ACCEPTED") {
      return NextResponse.json({ error: "Listing is no longer active" }, { status: 400 });
    }

    if (status === "REJECTED") {
      // Mark this offer as REJECTED
      const updatedOffer = await prisma.buyerOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" },
        include: { buyer: true }
      });
      return NextResponse.json(updatedOffer);
    }

    // Case: Farmer accepts the offer -> Transaction execution begins
    const lot = offer.lot;
    const farmer = lot.farmer;
    const buyer = offer.buyer;

    // 1. Calculate distance using real Haversine GPS coordinates (or district fallbacks)
    const distance = getDistanceBetweenLocations(
      lot.latitude,
      lot.longitude,
      buyer.latitude,
      buyer.longitude,
      farmer.district,
      buyer.district
    );
    const transportMode = lot.weight > 50 ? "DEDICATED" : "SHARED";
    let logisticsFee = calculateTransportFee(lot.weight, distance, transportMode);
    let selectedTransporterId: string | null = null;

    // If farmer selected a custom transporter bid
    if (transporterBidId) {
      const selectedBid = await prisma.transporterBid.findUnique({
        where: { id: transporterBidId }
      });
      if (selectedBid) {
        logisticsFee = selectedBid.offeredFee;
        selectedTransporterId = selectedBid.transporterId;
      }
    }

    // 2. Calculate platform commission fee (1% of the offer price total value)
    const grossValue = offer.offeredPrice * lot.weight;
    const platformFee = Math.round((grossValue * 0.01) * 100) / 100;

    // 3. Farmer's actual net payout realization
    const netRealization = Math.round((grossValue - logisticsFee - platformFee) * 100) / 100;

    // Execute in a transaction to maintain atomic safety
    const result = await prisma.$transaction(async (tx) => {
      // A. Update accepted offer
      const accOffer = await tx.buyerOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" }
      });

      // B. Reject all other offers for this lot
      await tx.buyerOffer.updateMany({
        where: {
          lotId: lot.id,
          id: { not: offerId },
          status: "PENDING"
        },
        data: { status: "REJECTED" }
      });

      // C. Update lot listing status to OFFER_ACCEPTED
      const updatedLot = await tx.lotListing.update({
        where: { id: lot.id },
        data: { status: "OFFER_ACCEPTED" }
      });

      // D. Update or create transport job with selected transporter or unassigned status
      let transportJob;
      if (lot.transportJob) {
        transportJob = await tx.transportJob.update({
          where: { id: lot.transportJob.id },
          data: {
            fee: logisticsFee,
            distance,
            mode: transportMode,
            transporterId: selectedTransporterId,
            status: selectedTransporterId ? "ASSIGNED" : "UNASSIGNED"
          }
        });
      } else {
        transportJob = await tx.transportJob.create({
          data: {
            mode: transportMode,
            fee: logisticsFee,
            distance,
            transporterId: selectedTransporterId,
            status: selectedTransporterId ? "ASSIGNED" : "UNASSIGNED",
            lotId: lot.id
          }
        });
      }

      // If transporter bid selected, update bid statuses
      if (transporterBidId) {
        await tx.transporterBid.update({
          where: { id: transporterBidId },
          data: { status: "ACCEPTED" }
        });
        if (lot.transportJob) {
          await tx.transporterBid.updateMany({
            where: {
              jobId: lot.transportJob.id,
              id: { not: transporterBidId }
            },
            data: { status: "REJECTED" }
          });
        }
      }

      // E. Generate final transaction record
      const transaction = await tx.transactionRecord.create({
        data: {
          buyerPrice: grossValue,
          logisticsFee,
          platformFee,
          netRealization,
          lotId: lot.id,
          buyerId: buyer.id
        }
      });

      return { accOffer, updatedLot, transportJob, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/offers PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error updating offer" }, { status: 500 });
  }
}
