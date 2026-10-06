import { NextRequest, NextResponse } from "next/server";
import { fetchMandiPrices } from "@/lib/mandiApi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || undefined;
  const district = searchParams.get("district") || undefined;
  const commodity = searchParams.get("commodity") || undefined;
  const limitStr = searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 50;

  try {
    const data = await fetchMandiPrices({ state, district, commodity, limit });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/mandi API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching mandi prices" },
      { status: 500 }
    );
  }
}
