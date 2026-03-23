import type { Rep, SupportedMunicipality } from "@/types";

export interface MunicipalityConfig {
  name: SupportedMunicipality;
  displayName: string;
  mayor: Omit<Rep, "id" | "level">;
  councilOffice: Omit<Rep, "id" | "level">;
  zoningCenter: [number, number];
  sources: {
    meetings: string;
    zoning?: string;
    development?: string;
  };
}

export const MUNICIPALITY_CONFIG: Record<
  SupportedMunicipality,
  MunicipalityConfig
> = {
  Milton: {
    name: "Milton",
    displayName: "Town of Milton",
    mayor: {
      title: "Mayor",
      name: "Gord Krantz",
      party: "Independent",
      partyColor: "#2D7A45",
      riding: "Town of Milton",
      photo: "/avatars/mayor.png",
      committee: "Town Council",
      attendance: 96,
      email: "mayor@milton.ca",
      lobbyMeetings: [],
    },
    councilOffice: {
      title: "Town Council",
      name: "Milton Council Office",
      party: "Municipal Government",
      partyColor: "#2D7A45",
      riding: "Town of Milton",
      committee: "Council and Committees",
      attendance: 100,
      email: "clerks@milton.ca",
      lobbyMeetings: [],
    },
    zoningCenter: [43.5183, -79.8774],
    sources: {
      meetings: "https://calendar.milton.ca/meetings",
      development: "https://discover-milton.hub.arcgis.com/",
    },
  },
  Waterloo: {
    name: "Waterloo",
    displayName: "City of Waterloo",
    mayor: {
      title: "Mayor",
      name: "Dorothy McCabe",
      party: "Independent",
      partyColor: "#2D7A45",
      riding: "City of Waterloo",
      committee: "City Council",
      attendance: 95,
      email: "dorothy.mccabe@waterloo.ca",
      lobbyMeetings: [],
    },
    councilOffice: {
      title: "City Council",
      name: "Waterloo Council Office",
      party: "Municipal Government",
      partyColor: "#2D7A45",
      riding: "City of Waterloo",
      committee: "Council and Committees",
      attendance: 100,
      email: "cityclerk@waterloo.ca",
      lobbyMeetings: [],
    },
    zoningCenter: [43.4643, -80.5204],
    sources: {
      meetings:
        "https://www.waterloo.ca/council-and-committees/council-and-committee-meetings/",
      zoning:
        "https://maps.waterloo.ca/arcgis/rest/services/General/Zoning/MapServer",
    },
  },
};

export function buildMunicipalReps(municipality: SupportedMunicipality): Rep[] {
  const config = MUNICIPALITY_CONFIG[municipality];

  return [
    {
      ...config.mayor,
      id: `${municipality.toLowerCase()}-mayor`,
      level: "Municipal",
    },
    {
      ...config.councilOffice,
      id: `${municipality.toLowerCase()}-council-office`,
      level: "Municipal",
    },
  ];
}
