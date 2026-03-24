import { NextRequest, NextResponse } from "next/server";
import { getMunicipalityZoningAlerts } from "@/lib/server/liveData";
import {
  inferMunicipalityFromPostalCode,
  normalizePostalCode,
} from "@/lib/utils/postalCode";

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

  const result = await getMunicipalityZoningAlerts(municipality);

  return NextResponse.json({
    ...result,
    municipality,
  });
}
