import { NextRequest, NextResponse } from "next/server";

import {
  inferMunicipalityFromPostalCode,
  normalizePostalCode,
} from "@/lib/utils/postalCode";
import type { FeedItem } from "@/types";
import { getMunicipalFeed } from "@/lib/server/municipalLive";
import { getFederalBills, getProvincialBills } from "@/lib/server/liveData";

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get("postalCode");

  if (!postalCode) {
    return NextResponse.json({ error: "postalCode required" }, { status: 400 });
  }

  const normalized = normalizePostalCode(postalCode);
  const municipality = inferMunicipalityFromPostalCode(normalized);

  if (!municipality) {
    return NextResponse.json(
      { error: "Unsupported postal code" },
      { status: 400 },
    );
  }

  try {
    // We wrap each call in a catch that returns an empty array.
    // This ensures that if one level of government's site is down,
    // the others still load for the user.
    const [muniItems, fedItems, provItems] = await Promise.all([
      getMunicipalFeed(municipality).catch((err) => {
        console.error("Muni error:", err);
        return [] as FeedItem[];
      }),
      getFederalBills().catch((err) => {
        console.error("Fed error:", err);
        return [] as FeedItem[];
      }),
      getProvincialBills().catch((err) => {
        console.error("Prov error:", err);
        return [] as FeedItem[];
      }),
    ]);

    // Combine and sort by date (newest first)
    const combinedFeed = [...muniItems, ...fedItems, ...provItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({
      feed: combinedFeed, // Note: your frontend expects 'feed', not 'items'
      municipality,
    });
  } catch (error) {
    console.error("Feed aggregation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 },
    );
  }
}
