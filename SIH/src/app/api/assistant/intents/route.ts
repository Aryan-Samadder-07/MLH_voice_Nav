import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const catalogPath = path.join(process.cwd(), "src", "data", "training_intents.json");

export async function GET() {
  try {
    if (fs.existsSync(catalogPath)) {
      const data = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
      return NextResponse.json({ routes: data });
    }
    return NextResponse.json({ routes: [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { route_id, utterance, language_code } = body;
    if (!route_id || !utterance) {
      return NextResponse.json({ error: "Missing route_id or utterance" }, { status: 400 });
    }

    let catalog: any[] = [];
    if (fs.existsSync(catalogPath)) {
      catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    }

    const route = catalog.find((r: any) => r.route_id === route_id);
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const lang = (language_code || "en").toLowerCase();
    const field = `utterances_${lang}`;
    if (!route[field]) route[field] = [];
    if (!route[field].includes(utterance)) {
      route[field].push(utterance);
    }

    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf-8");
    return NextResponse.json({ success: true, route });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
