import type { Rep, RepsData, SupportedMunicipality } from "@/types";
import { buildMunicipalReps } from "@/lib/server/municipalities";

const REPRESENT_BASE_URL = "https://represent.opennorth.ca";

interface RepresentRep {
  name: string;
  party_name?: string;
  district_name?: string;
  elected_office?: string;
  email?: string;
  representative_set_name?: string;
}

interface RepresentPostalResponse {
  city?: string;
  representatives_centroid?: RepresentRep[];
  representatives_concordance?: RepresentRep[];
}

const PARTY_COLORS: Record<string, string> = {
  Liberal: "#D71920",
  "Conservative Party of Canada": "#003F8A",
  Conservative: "#003F8A",
  "New Democratic Party": "#F37021",
  "Progressive Conservative Party of Ontario": "#003F8A",
  "Progressive Conservative": "#003F8A",
  Green: "#3D9B35",
  Independent: "#2D7A45",
};

function getPartyColor(party: string) {
  return PARTY_COLORS[party] ?? "#6B7280";
}

function uniqByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) {
      return false;
    }
    seen.add(item.name);
    return true;
  });
}

function mapRepresentatives(representatives: RepresentRep[]): Rep[] {
  return representatives
    .filter((rep) => rep.representative_set_name === "House of Commons" || rep.representative_set_name === "Ontario Legislature")
    .map((rep) => {
      const level = rep.representative_set_name === "House of Commons" ? "Federal" : "Provincial";
      const party = rep.party_name?.trim() || "Independent";
      return {
        id: `${level.toLowerCase()}-${rep.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        level,
        title: rep.elected_office || (level === "Federal" ? "Member of Parliament" : "Member of Provincial Parliament"),
        name: rep.name,
        party,
        partyColor: getPartyColor(party),
        riding: rep.district_name || "",
        committee: level === "Federal" ? "House of Commons" : "Legislative Assembly of Ontario",
        attendance: 0,
        email: rep.email || "",
        lobbyMeetings: [],
      } satisfies Rep;
    });
}

export async function fetchRepresentativesByPostalCode(
  postalCode: string,
  municipality: SupportedMunicipality | null
): Promise<RepsData | null> {
  const normalized = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const url = `${REPRESENT_BASE_URL}/postcodes/${normalized}/`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RepresentPostalResponse;
  const raw = uniqByName([
    ...(data.representatives_centroid ?? []),
    ...(data.representatives_concordance ?? []),
  ]);

  const seniorReps = mapRepresentatives(raw);
  const federalDistrict = seniorReps.find((rep) => rep.level === "Federal")?.riding;
  const provincialDistrict = seniorReps.find((rep) => rep.level === "Provincial")?.riding;

  return {
    postal: normalized,
    riding: municipality ? `${municipality}, Ontario` : data.city || federalDistrict || provincialDistrict || normalized,
    municipality: municipality ?? undefined,
    federalDistrict,
    provincialDistrict,
    reps: [...seniorReps, ...(municipality ? buildMunicipalReps(municipality) : [])],
  };
}
