import { NextRequest, NextResponse } from "next/server";
import { fetchRepresentativesByPostalCode } from "@/lib/server/represent";
import { inferMunicipalityFromPostalCode, normalizePostalCode } from "@/lib/utils/postalCode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode");

  if (!postalCode) {
    return NextResponse.json({ error: "postalCode is required" }, { status: 400 });
  }

  const normalized = normalizePostalCode(postalCode);
  const municipality = inferMunicipalityFromPostalCode(normalized);

  if (!municipality) {
    return NextResponse.json(
      {
        error: "This MVP currently supports Milton and Waterloo postal codes only.",
      },
      { status: 400 }
    );
  }

  try {
    const reps = await fetchRepresentativesByPostalCode(normalized, municipality);

    if (!reps) {
      return NextResponse.json({ error: "Unable to resolve representatives." }, { status: 502 });
    }

    return NextResponse.json(reps);
  } catch (error) {
    console.error("Failed to fetch representatives", error);
    return NextResponse.json({ error: "Failed to fetch representatives" }, { status: 500 });
  }
}
