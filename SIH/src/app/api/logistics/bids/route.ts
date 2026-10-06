import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const transporterId = searchParams.get("transporterId");

    const whereClause: any = {};
    if (jobId) whereClause.jobId = jobId;
    if (transporterId) whereClause.transporterId = transporterId;

    const bids = await prisma.transporterBid.findMany({
      where: whereClause,
      include: {
        transporter: true,
        job: {
          include: {
            lot: {
              include: {
                farmer: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("Error in /api/logistics/bids GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, transporterId, offeredFee, vehicleType, estimatedEtaHours } = body;

    if (!jobId || !transporterId || offeredFee === undefined || !vehicleType) {
      return NextResponse.json({ error: "Missing required bid submission parameters" }, { status: 400 });
    }

    // Verify job exists
    const job = await prisma.transportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: "Transport job not found" }, { status: 404 });
    }

    // Create bid
    const newBid = await prisma.transporterBid.create({
      data: {
        jobId,
        transporterId,
        offeredFee: parseFloat(offeredFee),
        vehicleType,
        estimatedEtaHours: estimatedEtaHours ? parseInt(estimatedEtaHours) : 24,
        status: "PENDING"
      },
      include: {
        transporter: true,
        job: true
      }
    });

    return NextResponse.json(newBid, { status: 201 });
  } catch (error) {
    console.error("Error in /api/logistics/bids POST:", error);
    return NextResponse.json({ error: "Internal Server Error creating transporter bid" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bidId, action } = body;

    if (!bidId || action !== "ACCEPT") {
      return NextResponse.json({ error: "Invalid bid action request" }, { status: 400 });
    }

    // Find the bid
    const bid = await prisma.transporterBid.findUnique({
      where: { id: bidId },
      include: { job: true }
    });

    if (!bid) {
      return NextResponse.json({ error: "Transporter bid not found" }, { status: 404 });
    }

    // Transaction: Accept selected bid, reject other bids for this job, and assign job
    const [acceptedBid, updatedJob] = await prisma.$transaction([
      prisma.transporterBid.update({
        where: { id: bidId },
        data: { status: "ACCEPTED" }
      }),
      prisma.transportJob.update({
        where: { id: bid.jobId },
        data: {
          transporterId: bid.transporterId,
          fee: bid.offeredFee,
          status: "ASSIGNED"
        }
      })
    ]);

    // Reject remaining bids
    await prisma.transporterBid.updateMany({
      where: {
        jobId: bid.jobId,
        id: { not: bidId }
      },
      data: { status: "REJECTED" }
    });

    return NextResponse.json({ bid: acceptedBid, job: updatedJob });
  } catch (error) {
    console.error("Error in /api/logistics/bids PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error accepting transporter bid" }, { status: 500 });
  }
}
