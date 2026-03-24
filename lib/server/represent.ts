import type { Rep, RepsData, SupportedMunicipality } from "@/types";

const REPRESENT_BASE_URL = "https://represent.opennorth.ca";

interface RepresentOffice {
  tel?: string;
  fax?: string;
  type?: string;
  postal?: string;
}

interface RepresentRep {
  name: string;
  first_name?: string;
  last_name?: string;
  party_name?: string;
  district_name?: string;
  elected_office?: string;
  email?: string;
  url?: string;
  photo_url?: string;
  representative_set_name?: string;
  offices?: RepresentOffice[];
  extra?: { roles?: string[] };
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
  NDP: "#F37021",
  "Progressive Conservative Party of Ontario": "#003F8A",
  "Progressive Conservative": "#003F8A",
  Green: "#3D9B35",
  "Green Party of Canada": "#3D9B35",
  "Bloc Québécois": "#00AEEF",
  Independent: "#2D7A45",
};

function getPartyColor(party: string) {
  return PARTY_COLORS[party] ?? "#6B7280";
}

function uniqByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function getLevel(setName: string): "Federal" | "Provincial" | "Municipal" | null {
  if (setName === "House of Commons") return "Federal";
  if (setName === "Legislative Assembly of Ontario") return "Provincial";
  // Any council / municipal set
  if (
    setName.toLowerCase().includes("council") ||
    setName.toLowerCase().includes("municipality") ||
    setName.toLowerCase().includes("city of") ||
    setName.toLowerCase().includes("town of")
  ) return "Municipal";
  return null;
}

function mapRep(rep: RepresentRep): Rep | null {
  const setName = rep.representative_set_name ?? "";
  const level = getLevel(setName);
  if (!level) return null;

  const party = rep.party_name?.trim() || "Independent";
  const constituencyOffice = rep.offices?.find((o) => o.type === "constituency");
  const phone = constituencyOffice?.tel ?? rep.offices?.[0]?.tel ?? "";

  const committeeLabel =
    level === "Federal"
      ? "House of Commons"
      : level === "Provincial"
      ? "Legislative Assembly of Ontario"
      : setName;

  return {
    id: `${level.toLowerCase()}-${rep.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    level,
    title: rep.elected_office || (level === "Federal" ? "Member of Parliament" : level === "Provincial" ? "Member of Provincial Parliament" : "Councillor"),
    name: rep.name,
    party,
    partyColor: getPartyColor(party),
    riding: rep.district_name || "",
    photo: rep.photo_url || undefined,
    committee: committeeLabel,
    attendance: 0,
    email: rep.email || "",
    lobbyMeetings: [],
  } satisfies Rep;
}

export async function fetchRepresentativesByPostalCode(
  postalCode: string,
  municipality: SupportedMunicipality | null
): Promise<RepsData | null> {
  const normalized = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const url = `${REPRESENT_BASE_URL}/postcodes/${normalized}/`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;

  const data = (await response.json()) as RepresentPostalResponse;
  const raw = uniqByName([
    ...(data.representatives_centroid ?? []),
    ...(data.representatives_concordance ?? []),
  ]);

  const reps = raw.map(mapRep).filter((r): r is Rep => r !== null);

  const federalDistrict = reps.find((r) => r.level === "Federal")?.riding;
  const provincialDistrict = reps.find((r) => r.level === "Provincial")?.riding;

  return {
    postal: normalized,
    riding: municipality ? `${municipality}, Ontario` : data.city || federalDistrict || provincialDistrict || normalized,
    municipality: municipality ?? undefined,
    federalDistrict,
    provincialDistrict,
    reps,
  };
}
