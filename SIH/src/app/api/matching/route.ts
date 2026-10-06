import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMandiPrices } from "@/lib/mandiApi";
import { getDistanceBetweenDistricts, calculateTransportFee } from "@/lib/logisticsUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lotId = searchParams.get("lotId");

  if (!lotId) {
    return NextResponse.json({ error: "Missing required lotId parameter" }, { status: 400 });
  }

  try {
    // 1. Fetch the lot details
    const lot = await prisma.lotListing.findUnique({
      where: { id: lotId },
      include: {
        farmer: true,
        offers: {
          include: {
            buyer: true
          }
        }
      }
    });

    if (!lot) {
      return NextResponse.json({ error: "Lot listing not found" }, { status: 404 });
    }

    // 2. Fetch live government Mandi prices for this commodity in the same State/District
    const mandiPrices = await fetchMandiPrices({
      commodity: lot.commodity,
      state: lot.farmer.state,
      limit: 10
    });

    // Extract modal price benchmark if found (otherwise default to lot minPrice)
    const matchedMandi = mandiPrices.find(
      (m) => m.commodity.toLowerCase().includes(lot.commodity.toLowerCase())
    );
    const mandiBenchmarkPrice = matchedMandi ? matchedMandi.modal_price : lot.minPrice;

    // 3. Process and rank all submitted bids based on Net Realization
    const rankedOffers = lot.offers.map((offer) => {
      const buyer = offer.buyer;
      const farmer = lot.farmer;

      // Real distance and fee calculation
      const distance = getDistanceBetweenDistricts(farmer.district, buyer.district);
      const transportMode = lot.weight > 50 ? "DEDICATED" : "SHARED";
      const logisticsFee = calculateTransportFee(lot.weight, distance, transportMode);

      // 1% platform fee
      const grossValue = offer.offeredPrice * lot.weight;
      const platformFee = Math.round((grossValue * 0.01) * 100) / 100;

      // Net Realization
      const netRealization = Math.round((grossValue - logisticsFee - platformFee) * 100) / 100;
      const netRealizationPerQuintal = Math.round((netRealization / lot.weight) * 100) / 100;

      return {
        id: offer.id,
        offeredPrice: offer.offeredPrice,
        quantity: offer.quantity,
        status: offer.status,
        createdAt: offer.createdAt,
        buyer: {
          id: buyer.id,
          name: buyer.name,
          state: buyer.state,
          district: buyer.district,
          phone: buyer.phone
        },
        logistics: {
          distance,
          mode: transportMode,
          fee: logisticsFee
        },
        economics: {
          grossValue,
          platformFee,
          netRealization,
          netRealizationPerQuintal
        }
      };
    });

    // Sort by Net Realization descending
    rankedOffers.sort((a, b) => b.economics.netRealization - a.economics.netRealization);

    return NextResponse.json({
      lot: {
        id: lot.id,
        commodity: lot.commodity,
        variety: lot.variety,
        weight: lot.weight,
        grade: lot.grade,
        minPrice: lot.minPrice,
        pickupLocation: lot.pickupLocation,
        status: lot.status,
        farmer: {
          name: lot.farmer.name,
          state: lot.farmer.state,
          district: lot.farmer.district
        }
      },
      mandiBenchmark: {
        modalPricePerQuintal: mandiBenchmarkPrice,
        modalPricePerKg: Math.round((mandiBenchmarkPrice / 100) * 100) / 100,
        source: matchedMandi ? `${matchedMandi.market} Mandi, ${matchedMandi.state}` : "Lasalgaon Benchmark Cache",
        arrivalDate: matchedMandi?.arrival_date || new Date().toLocaleDateString("en-GB")
      },
      offers: rankedOffers
    });
  } catch (error) {
    console.error("Error in /api/matching GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
