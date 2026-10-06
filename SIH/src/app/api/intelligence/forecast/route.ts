import { NextRequest, NextResponse } from "next/server";

interface CommodityTrend {
  forecast7dPct: number;
  forecast30dPct: number;
  perishabilityDailyPct: number;
  storageCostPerQuintalDaily: number; // ₹/q/day
  description: string;
}

const COMMODITY_TRENDS: Record<string, CommodityTrend> = {
  Tomato: {
    forecast7dPct: 6.5,
    forecast30dPct: 14.2,
    perishabilityDailyPct: 0.8, // high perishability
    storageCostPerQuintalDaily: 4.5, // cold storage needed
    description: "High demand expected in regional metropolitan mandis due to supply pinch."
  },
  Onion: {
    forecast7dPct: 4.0,
    forecast30dPct: 11.5,
    perishabilityDailyPct: 0.2, // low perishability
    storageCostPerQuintalDaily: 1.5,
    description: "Favorable holding conditions; wholesale prices trending upward."
  },
  Potato: {
    forecast7dPct: 2.5,
    forecast30dPct: 8.0,
    perishabilityDailyPct: 0.15,
    storageCostPerQuintalDaily: 1.2,
    description: "Stable cold storage holding value with steady buyer demand."
  },
  Paddy: {
    forecast7dPct: 1.8,
    forecast30dPct: 5.5,
    perishabilityDailyPct: 0.05,
    storageCostPerQuintalDaily: 0.8,
    description: "Low perishability staple. Steady MSP and private mill procurement."
  },
  Soybean: {
    forecast7dPct: 5.2,
    forecast30dPct: 13.0,
    perishabilityDailyPct: 0.1,
    storageCostPerQuintalDaily: 1.0,
    description: "Oilseed processor demand rising; holding advised if storage is dry."
  },
  Cotton: {
    forecast7dPct: 3.5,
    forecast30dPct: 9.8,
    perishabilityDailyPct: 0.05,
    storageCostPerQuintalDaily: 1.0,
    description: "Textile mill procurement steady with favorable export trends."
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get("commodity") || "Tomato";
    const currentPrice = parseFloat(searchParams.get("currentPrice") || "2500"); // ₹/q
    const weight = parseFloat(searchParams.get("weight") || "50"); // quintals
    const storageDays = parseInt(searchParams.get("storageDays") || "14"); // days

    const trend = COMMODITY_TRENDS[commodity] || COMMODITY_TRENDS["Tomato"];

    // 7-day and 30-day projected prices
    const price7d = Math.round(currentPrice * (1 + trend.forecast7dPct / 100));
    const price30d = Math.round(currentPrice * (1 + trend.forecast30dPct / 100));

    // Immediate Sale Value
    const grossSellNow = weight * currentPrice;
    const netSellNow = grossSellNow * 0.99 - (weight * 35); // Gross minus 1% fee & baseline shared freight

    // Wait Value (after storageDays)
    const projectedPriceHold = Math.round(currentPrice * (1 + (trend.forecast30dPct * (storageDays / 30)) / 100));
    const grossHold = weight * projectedPriceHold;

    // Storage cost total
    const totalStorageCost = Math.round(weight * trend.storageCostPerQuintalDaily * storageDays);
    // Spoilage risk cost total
    const spoilageLossValue = Math.round(grossHold * (trend.perishabilityDailyPct / 100) * storageDays);

    const netWaitValue = Math.round(grossHold - totalStorageCost - spoilageLossValue - (grossHold * 0.01) - (weight * 35));
    const netGainOrLoss = netWaitValue - netSellNow;

    const recommendation = netGainOrLoss > 500 ? "HOLD_IN_STORAGE" : "SELL_NOW";
    const adviceText =
      recommendation === "HOLD_IN_STORAGE"
        ? `Holding your harvest for ${storageDays} days is projected to generate an extra net payout of ₹${netGainOrLoss.toLocaleString()} after accounting for storage costs and quality loss.`
        : `High perishability or low future price appreciation makes selling your lot now the most profitable strategy.`;

    return NextResponse.json({
      commodity,
      currentPrice,
      weight,
      storageDays,
      forecast: {
        price7d,
        change7dPct: trend.forecast7dPct,
        price30d,
        change30dPct: trend.forecast30dPct,
        description: trend.description
      },
      economics: {
        netSellNow: Math.round(netSellNow),
        netWaitValue,
        netGainOrLoss,
        totalStorageCost,
        spoilageLossValue,
        recommendation,
        adviceText
      }
    });
  } catch (error) {
    console.error("Error in /api/intelligence/forecast GET:", error);
    return NextResponse.json({ error: "Internal Server Error in AI Forecasting" }, { status: 500 });
  }
}
