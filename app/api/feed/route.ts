import { NextRequest, NextResponse } from "next/server";
import { getMunicipalFeed } from "@/lib/server/municipalLive";

export async function GET(req: NextRequest) {
  const municipality = req.nextUrl.searchParams.get("municipality");

  if (municipality !== "Milton" && municipality !== "Waterloo") {
    return NextResponse.json(
      { error: "Unsupported municipality" },
      { status: 400 },
    );
  }

  try {
    const items = await getMunicipalFeed(municipality);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load feed",
      },
      { status: 500 },
    );
  }
}
