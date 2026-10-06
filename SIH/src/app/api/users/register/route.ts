import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, password, role, state, district, latitude, longitude } = body;

    if (!name || !phone || !role || !state || !district) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    // Check if phone number is already registered
    const existing = await prisma.user.findUnique({
      where: { phone }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this phone number is already registered." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password || "password123", 10);

    // Create user in PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role,
        state,
        district,
        latitude: latitude != null ? parseFloat(latitude) : null,
        longitude: longitude != null ? parseFloat(longitude) : null
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error in /api/users/register POST:", error);
    return NextResponse.json({ error: "Internal Server Error creating user profile" }, { status: 500 });
  }
}
