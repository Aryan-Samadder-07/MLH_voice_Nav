import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transporterId = searchParams.get("transporterId") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    let whereClause: any = {};

    if (transporterId) {
      whereClause.transporterId = transporterId;
    } else {
      // If no transporter specified, show unassigned jobs (status UNASSIGNED or ASSIGNED with null transporterId)
      whereClause.OR = [
        { status: "UNASSIGNED" },
        { status: "ASSIGNED", transporterId: null }
      ];
    }

    if (status) {
      delete whereClause.OR;
      whereClause.status = status;
    }

    const jobs = await prisma.transportJob.findMany({
      where: whereClause,
      include: {
        lot: {
          include: {
            farmer: true,
            offers: {
              where: { status: "ACCEPTED" },
              include: { buyer: true }
            }
          }
        },
        transporter: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error in /api/logistics GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, transporterId, status } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing required jobId parameter" }, { status: 400 });
    }

    // Retrieve the current job state
    const job = await prisma.transportJob.findUnique({
      where: { id: jobId },
      include: { lot: true }
    });

    if (!job) {
      return NextResponse.json({ error: "Transport job not found" }, { status: 404 });
    }

    // Execute updates
    const result = await prisma.$transaction(async (tx) => {
      let updateData: any = {};

      if (transporterId && !job.transporterId) {
        // Claiming the job
        updateData.transporterId = transporterId;
        updateData.status = "LOADING";
      }

      if (status) {
        updateData.status = status;
      }

      const updatedJob = await tx.transportJob.update({
        where: { id: jobId },
        data: updateData,
        include: {
          lot: {
            include: { farmer: true }
          },
          transporter: true
        }
      });

      // If job is delivered, finalize transaction lifecycle
      if (status === "DELIVERED") {
        // A. Set lot listing status to COMPLETED
        await tx.lotListing.update({
          where: { id: job.lotId },
          data: { status: "COMPLETED" }
        });

        // B. Generate transporter payout record
        if (updatedJob.transporterId) {
          await tx.transporterTransaction.create({
            data: {
              fee: job.fee,
              transporterId: updatedJob.transporterId
            }
          });
        }
      }

      return updatedJob;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/logistics PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error updating logistics job" }, { status: 500 });
  }
}
