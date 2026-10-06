import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { passwordHash: _, ...userProfile } = user;
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error in /api/transporter/profile GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, perKmRate, baseFare, vehicleType, latitude, longitude } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        perKmRate: perKmRate !== undefined ? parseFloat(perKmRate) : undefined,
        baseFare: baseFare !== undefined ? parseFloat(baseFare) : undefined,
        vehicleType: vehicleType !== undefined ? vehicleType : undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      }
    });

    const { passwordHash: _, ...userProfile } = updatedUser;
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error in /api/transporter/profile PATCH:", error);
    return NextResponse.json({ error: "Internal Server Error updating profile" }, { status: 500 });
  }
}
