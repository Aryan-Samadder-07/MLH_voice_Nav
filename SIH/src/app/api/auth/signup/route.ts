import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, password, role, state, district, latitude, longitude, otp } = body;

    const cleanPhone = String(phone || "").trim().replace(/\D/g, "");

    if (!name || !cleanPhone || !role || !state || !district) {
      return NextResponse.json({ error: "Name, phone, role, state, and district are required." }, { status: 400 });
    }

    // Check existing phone
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please log in." },
        { status: 400 }
      );
    }

    // Generate secure password hash
    const passToHash = password && password.trim() ? password : `OTP_VERIFIED_${cleanPhone}_KRISHILINK`;
    const passwordHash = await bcrypt.hash(passToHash, 10);

    // Create user in Neon PostgreSQL DB
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        passwordHash,
        role: role.toUpperCase(),
        state: state.trim(),
        district: district.trim(),
        latitude: latitude != null ? parseFloat(latitude) : null,
        longitude: longitude != null ? parseFloat(longitude) : null
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Error in /api/auth/signup POST:", error);
    const errorMessage = error?.message || "Internal Server Error during signup";
    return NextResponse.json(
      { error: "Database error during signup", details: errorMessage },
      { status: 500 }
    );
  }
}
