import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("targetUserId");
  const reviewerId = searchParams.get("reviewerId");
  const lotId = searchParams.get("lotId");

  try {
    const whereClause: any = {};
    if (targetUserId) whereClause.targetUserId = targetUserId;
    if (reviewerId) whereClause.reviewerId = reviewerId;
    if (lotId) whereClause.lotId = lotId;

    const ratings = await prisma.rating.findMany({
      where: whereClause,
      include: {
        reviewer: true,
        targetUser: true,
        lot: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Compute average score if targetUserId provided
    let averageScore = 5.0;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.score, 0);
      averageScore = Math.round((sum / ratings.length) * 10) / 10;
    }

    return NextResponse.json({
      ratings,
      count: ratings.length,
      averageScore
    });
  } catch (error) {
    console.error("Error in /api/ratings GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, comment, reviewerId, targetUserId, lotId } = body;

    const parsedScore = parseInt(score);
    if (!parsedScore || parsedScore < 1 || parsedScore > 5 || !reviewerId || !targetUserId) {
      return NextResponse.json({ error: "Missing required rating parameters (score must be 1-5)" }, { status: 400 });
    }

    // 1. Create rating record
    const rating = await prisma.rating.create({
      data: {
        score: parsedScore,
        comment: comment || undefined,
        reviewerId,
        targetUserId,
        lotId: lotId || undefined
      },
      include: {
        reviewer: true,
        targetUser: true
      }
    });

    // 2. Recalculate target user's overall reliability score
    const targetUserRatings = await prisma.rating.findMany({
      where: { targetUserId }
    });

    const sum = targetUserRatings.reduce((acc, r) => acc + r.score, 0);
    const newAverage = Math.round((sum / targetUserRatings.length) * 10) / 10;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { reliabilityScore: newAverage }
    });

    return NextResponse.json({
      rating,
      newReliabilityScore: updatedUser.reliabilityScore
    }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/ratings POST:", error);
    return NextResponse.json({ error: "Internal Server Error submitting rating" }, { status: 500 });
  }
}
