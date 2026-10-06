import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, otp } = body;

    const cleanPhone = String(phone || "").trim().replace(/\D/g, "");

    if (!cleanPhone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this phone number. Please sign up first." }, { status: 404 });
    }

    // If logging in via OTP (voice-friendly verification)
    if (otp) {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    // If logging in via password
    if (password) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid password. Please try again or use OTP." }, { status: 401 });
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    return NextResponse.json({ error: "OTP or password is required to log in." }, { status: 400 });
  } catch (error) {
    console.error("Error in /api/auth/login POST:", error);
    return NextResponse.json({ error: "Internal Server Error during login" }, { status: 500 });
  }
}
