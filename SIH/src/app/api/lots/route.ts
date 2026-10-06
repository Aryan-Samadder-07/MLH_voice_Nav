import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId") || undefined;
  const buyerId = searchParams.get("buyerId") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    let whereClause: any = {};

    if (farmerId) {
      whereClause.farmerId = farmerId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (buyerId) {
      // Find lots where this buyer has placed an offer
      whereClause.offers = {
        some: {
          buyerId: buyerId
        }
      };
    }

    const lots = await prisma.lotListing.findMany({
      where: whereClause,
      include: {
        farmer: true,
        offers: {
          include: {
            buyer: true
          }
        },
        transportJob: {
          include: {
            transporter: true,
            bids: {
              include: { transporter: true }
            }
          }
        },
        transaction: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(lots);
  } catch (error) {
    console.error("Error in /api/lots GET route:", error);
    return NextResponse.json({ error: "Internal Server Error fetching lots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commodity, variety, weight, grade, pickupLocation, minPrice, farmerId, latitude, longitude } = body;

    // Validate inputs
    if (!commodity || !variety || !weight || !grade || !pickupLocation || !minPrice || !farmerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedWeight = parseFloat(weight);

    // Create the lot listing & open transport job atomically
    const lot = await prisma.$transaction(async (tx) => {
      const newLot = await tx.lotListing.create({
        data: {
          commodity,
          variety,
          weight: parsedWeight,
          grade,
          pickupLocation,
          minPrice: parseFloat(minPrice),
          farmerId,
          latitude: latitude != null ? parseFloat(latitude) : null,
          longitude: longitude != null ? parseFloat(longitude) : null,
          status: "ACTIVE"
        },
        include: {
          farmer: true
        }
      });

      // Create open transport job for freight bidding
      const defaultMode = parsedWeight > 50 ? "DEDICATED" : "SHARED";
      const defaultEstFee = Math.max(1500, Math.round(parsedWeight * 35));

      await tx.transportJob.create({
        data: {
          lotId: newLot.id,
          mode: defaultMode,
          fee: defaultEstFee,
          distance: 40, // default intra-district baseline distance in km
          status: "UNASSIGNED"
        }
      });

      return newLot;
    });

    return NextResponse.json(lot, { status: 201 });
  } catch (error) {
    console.error("Error in /api/lots POST route:", error);
    return NextResponse.json({ error: "Internal Server Error creating lot" }, { status: 500 });
  }
}
