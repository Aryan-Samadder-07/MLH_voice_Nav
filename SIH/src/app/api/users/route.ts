import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error in /api/users API route:", error);
    const errorMessage = error?.message || "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to fetch users from database", details: errorMessage },
      { status: 500 }
    );
  }
}
