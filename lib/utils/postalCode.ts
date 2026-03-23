import type { SupportedMunicipality } from "@/types";

const MUNICIPALITY_PREFIXES: Record<SupportedMunicipality, string[]> = {
  Milton: ["L9T", "L9E"],
  Waterloo: ["N2J", "N2K", "N2L", "N2T", "N2V"],
};

export function normalizePostalCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function inferMunicipalityFromPostalCode(
  postalCode: string | null | undefined
): SupportedMunicipality | null {
  if (!postalCode) {
    return null;
  }

  const normalized = normalizePostalCode(postalCode);
  const prefix = normalized.slice(0, 3);

  for (const [municipality, prefixes] of Object.entries(MUNICIPALITY_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return municipality as SupportedMunicipality;
    }
  }

  return null;
}
