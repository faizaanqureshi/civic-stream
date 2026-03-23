import type { FeedItem, SupportedMunicipality, ZoningAlert } from "@/types";
import { MUNICIPALITY_CONFIG } from "./municipalities";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 CivicStream/1.0",
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 60 * 30 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 CivicStream/1.0",
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 60 * 30 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.json();
}

function buildMeetingItem(
  id: string,
  title: string,
  summary: string,
  date: string,
  icon = "🗓️",
): FeedItem {
  return {
    id,
    level: "Municipal",
    type: "meeting",
    title,
    summary,
    date,
    isNew: false,
    urgency: "medium",
    linkedBillId: null,
    icon,
  };
}

function buildAlertItem(
  id: string,
  title: string,
  summary: string,
  date: string,
  icon = "📍",
): FeedItem {
  return {
    id,
    level: "Municipal",
    type: "alert",
    title,
    summary,
    date,
    isNew: false,
    urgency: "medium",
    linkedBillId: null,
    icon,
  };
}

/**
 * Milton:
 * Scrapes public meeting pages.
 * This is the most realistic lightweight approach before adding a dedicated eScribe parser.
 */
async function getMiltonFeed(): Promise<FeedItem[]> {
  const html = await fetchText(MUNICIPALITY_CONFIG.Milton.sources.meetings);

  const matches = [...html.matchAll(/\/meetings\/Detail\/([^"' ]+)/g)]
    .slice(0, 6)
    .map((m) => m[0]);

  const uniqueLinks = [...new Set(matches)];

  if (uniqueLinks.length === 0) {
    return [
      buildMeetingItem(
        "milton-meetings-fallback",
        "Milton council meetings",
        "Live Milton meeting scraping returned no items. Keep this as a safe fallback while refining the parser.",
        new Date().toISOString(),
      ),
    ];
  }

  return uniqueLinks
    .slice(0, 4)
    .map((href, index) =>
      buildMeetingItem(
        `milton-meeting-${index}`,
        "Milton Council / Committee Meeting",
        `Meeting discovered from Milton public calendar: ${href}`,
        new Date().toISOString(),
      ),
    );
}

/**
 * Waterloo:
 * Scrapes the city's public council page for the calendar link and turns it into feed items.
 */
async function getWaterlooFeed(): Promise<FeedItem[]> {
  const html = await fetchText(MUNICIPALITY_CONFIG.Waterloo.sources.meetings);

  const summary = stripHtml(html).slice(0, 240);

  return [
    buildMeetingItem(
      "waterloo-council-page",
      "Waterloo council and committee meetings",
      summary || "Public meeting information from the City of Waterloo.",
      new Date().toISOString(),
    ),
  ];
}

/**
 * Waterloo zoning:
 * Uses the public ArcGIS Zoning MapServer endpoint.
 * We query a few top features as a first working version.
 */
async function getWaterlooZoning(): Promise<ZoningAlert[]> {
  const queryUrl =
    "https://maps.waterloo.ca/arcgis/rest/services/General/Zoning/MapServer/0/query" +
    "?where=1%3D1&outFields=*&returnGeometry=true&f=json&resultRecordCount=8";

  const data = await fetchJson<{
    features?: Array<{
      attributes?: Record<string, unknown>;
      geometry?: { x?: number; y?: number };
    }>;
  }>(queryUrl);

  const features = data.features ?? [];

  if (features.length === 0) {
    return [];
  }

  return features
    .filter(
      (f) =>
        typeof f.geometry?.x === "number" && typeof f.geometry?.y === "number",
    )
    .slice(0, 6)
    .map((feature, index) => {
      const attrs = feature.attributes ?? {};
      const x = feature.geometry!.x!;
      const y = feature.geometry!.y!;

      return {
        id: `waterloo-zoning-${index}`,
        title: String(
          attrs["ZONE_NAME"] ??
            attrs["ZONE"] ??
            attrs["NAME"] ??
            `Waterloo zoning area ${index + 1}`,
        ),
        type: "Rezoning",
        status: "Active",
        urgency: "low",
        lat: y,
        lng: x,
        radius: 200,
        summary: `Live zoning feature from Waterloo ArcGIS.`,
        date: new Date().toISOString(),
        linkedBillId: null,
      };
    });
}

/**
 * Milton development:
 * Until you wire the exact feature service query URL, keep this live-ish placeholder
 * sourced from the municipal hub instead of fake manual copy.
 */
async function getMiltonZoning(): Promise<ZoningAlert[]> {
  return [
    {
      id: "milton-dev-live-placeholder",
      title: "Milton development applications",
      type: "New Development",
      status: "Active",
      urgency: "medium",
      lat: 43.5183,
      lng: -79.8774,
      radius: 350,
      summary:
        "Milton publishes active development applications through its ArcGIS Hub. Add the direct feature query URL once you lock the exact dataset endpoint.",
      date: new Date().toISOString(),
      linkedBillId: null,
    },
  ];
}

export async function getMunicipalFeed(
  municipality: SupportedMunicipality,
): Promise<FeedItem[]> {
  if (municipality === "Milton") return getMiltonFeed();
  return getWaterlooFeed();
}

export async function getMunicipalZoning(
  municipality: SupportedMunicipality,
): Promise<ZoningAlert[]> {
  if (municipality === "Milton") return getMiltonZoning();
  return getWaterlooZoning();
}
