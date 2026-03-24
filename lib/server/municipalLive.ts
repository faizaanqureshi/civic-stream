import type { FeedItem, SupportedMunicipality, ZoningAlert } from "@/types";
import { MUNICIPALITY_CONFIG } from "./municipalities";

/**
 * UTILS
 */
export function stripHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "") // Remove styles
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CivicStream/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Helper to get center of ArcGIS Polygons
export function getCentroid(geometry: any): { lat: number; lng: number } {
  if (geometry?.x && geometry?.y) return { lat: geometry.y, lng: geometry.x };
  if (geometry?.rings && geometry.rings[0]) {
    // Basic average of points for polygon centroid
    const points = geometry.rings[0];
    let lat = 0,
      lng = 0;
    points.forEach((p: number[]) => {
      lng += p[0];
      lat += p[1];
    });
    return { lat: lat / points.length, lng: lng / points.length };
  }
  return { lat: 43.4643, lng: -80.5204 }; // Default Waterloo
}

export function stripHtmlWaterloo(html: string) {
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanZoningText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .replace(/^[-\s•|]+/, "")
    .trim();
}

async function getWaterlooZoning(): Promise<ZoningAlert[]> {
  const baseUrl = "https://www.engagewr.ca";
  const endpoints = [
    {
      name: "Approved",
      url: `${baseUrl}/development-planning-projects/apps-with-decisions`,
      status: "Approved" as const,
    },
    {
      name: "Under Review",
      url: `${baseUrl}/development-planning-projects`,
      status: "Under Review" as const,
    },
  ];

  try {
    const feedPromises = endpoints.map(async (endpoint) => {
      console.log(`Scraping ${endpoint.name} from: ${endpoint.url}`);
      let html = await fetchText(endpoint.url);

      const items: ZoningAlert[] = [];

      // FIX: Find the actual start of the project list for both pages
      const startMarkers = [
        "Current applications",
        "About the applications listed on this page",
        "Council has made a decision",
      ];

      let contentStartIndex = -1;
      for (const marker of startMarkers) {
        const idx = html.indexOf(marker);
        if (idx !== -1) {
          contentStartIndex = idx;
          break;
        }
      }

      // If we found a marker, skip the header junk
      if (contentStartIndex !== -1) {
        html = html.substring(contentStartIndex);
      }

      // Regex looks for any text followed by the "Learn more" link
      const pattern = /([\s\S]*?)<a[^>]+href="([^"]+)"[^>]*>Learn more/gi;
      let match;

      while ((match = pattern.exec(html)) !== null) {
        const rawText = stripHtmlWaterloo(match[1]);
        const detailUrl = match[2];

        // Split by known file number patterns or newlines
        const lines = rawText
          .split(/\n/)
          .map((l) => cleanZoningText(l))
          .filter((l) => l.length > 5);

        if (lines.length > 0) {
          // The title is usually the first line (the address)
          const title = lines[0];
          // The summary is everything else joined together
          const summary =
            lines.length > 1 ? lines.slice(1).join(" ") : lines[0];

          // Jitter to spread pins around Waterloo City Hall
          const jitter = () => (Math.random() - 0.5) * 0.015;

          // Filter out navigation links that might have survived
          if (
            title.length > 5 &&
            !title.includes("Skip to main") &&
            !title.includes("Privacy Policy")
          ) {
            items.push({
              id: `waterloo-${endpoint.name.toLowerCase()}-${detailUrl.split("/").pop()}`,
              title: title,
              type: "Planning Application",
              status: endpoint.status,
              urgency: endpoint.status === "Under Review" ? "high" : "low",
              lat: 43.4643 + jitter(),
              lng: -80.5204 + jitter(),
              radius: 300,
              summary:
                summary.length > 200 ? `${summary.slice(0, 200)}...` : summary,
              date: new Date().toISOString(),
              linkedBillId: null,
            });
          }
        }
      }
      console.log(`Found ${items.length} ${endpoint.name} items.`);
      return items;
    });

    const allResults = await Promise.all(feedPromises);
    return allResults.flat();
  } catch (err) {
    console.error("Waterloo Scraper Error:", err);
    return [];
  }
}

export async function getWaterlooApprovedZoning(): Promise<ZoningAlert[]> {
  console.log("we are not here");
  const url =
    "https://www.engagewr.ca/development-planning-projects/apps-with-decisions";

  try {
    let html = await fetchText(url); // Assuming fetchText is your HTML fetching wrapper
    const items: ZoningAlert[] = [];

    // 1. Isolate the content to avoid header/menu garbage
    const startMarker = "About the applications listed";
    const startIndex = html.indexOf(startMarker);
    if (startIndex !== -1) {
      html = html.substring(startIndex);
    }

    // 2. Split using a capture group to grab the URL AND split the text
    // This creates an array like: [ "Text Block 1", "/url-1", "Text Block 2", "/url-2" ]
    const chunks = html.split(/<a[^>]*href="([^"]+)"[^>]*>\s*Learn more/i);

    // 3. Step through the array by 2 to process pairs of (Text, URL)
    for (let i = 0; i < chunks.length - 1; i += 2) {
      const rawHtmlChunk = chunks[i];
      const detailUrlPath = chunks[i + 1];

      if (!detailUrlPath) continue;

      // Clean the HTML tags out of this specific chunk
      const cleanText = stripHtmlWaterloo(rawHtmlChunk);

      // Split into lines to separate Title and Summary
      const lines = cleanText
        .split(/\n/)
        .map((l) => cleanZoningText(l))
        .filter((l) => l.length > 5); // Ignore tiny fragments

      if (lines.length >= 1) {
        // The title is usually the last valid line before the "Learn more" button
        const title = lines[lines.length - 1];
        // The summary is usually the line right above the title
        const summary =
          lines.length >= 2
            ? lines[lines.length - 2]
            : "Council has reached a decision on this application.";

        // Final safety check to avoid parsing footer links
        if (
          !title.toLowerCase().includes("privacy") &&
          !title.toLowerCase().includes("terms of use")
        ) {
          // Spread pins out slightly so they don't stack directly on top of each other
          const jitter = () => (Math.random() - 0.5) * 0.02;

          items.push({
            id: `waterloo-approved-${detailUrlPath.split("/").pop()}`,
            title: title,
            type: "Planning Application",
            status: "Approved",
            urgency: "low",
            lat: 43.4643 + jitter(),
            lng: -80.5204 + jitter(),
            radius: 300,
            summary:
              summary.length > 200 ? `${summary.slice(0, 200)}...` : summary,
            date: new Date().toISOString(),
            linkedBillId: null, // Update this if you cross-reference council bills
          });
        }
      }
    }

    console.log(`Successfully scraped ${items.length} Approved items.`);
    return items;
  } catch (err) {
    console.error("Error scraping Waterloo Approved projects:", err);
    return [];
  }
}
/**
 * MILTON
 */
async function getMiltonZoning(): Promise<ZoningAlert[]> {
  const wardUrls = [
    "https://www.milton.ca/en/business-and-development/ward-1-applications.aspx",
    "https://www.milton.ca/en/business-and-development/ward-2-development-applications.aspx",
    "https://www.milton.ca/en/business-and-development/ward-3-development-applications.aspx",
    "https://www.milton.ca/en/business-and-development/ward-4-development-applications.aspx",
  ];

  const results: ZoningAlert[] = [];
  const now = new Date().toISOString();

  try {
    const pages = await Promise.all(
      wardUrls.map((url) => fetchText(url).catch(() => "")),
    );

    pages.forEach((html, pageIdx) => {
      // 1. Split the page into sections by <h3> (which Milton uses for Project Titles/Addresses)
      const sections = html.split(/<h3[^>]*>/i).slice(1); // skip the first part before the first H3

      sections.forEach((section, sectionIdx) => {
        // 2. Extract title from the start of the section (up to the closing </h3>)
        const titleMatch = section.match(/([\s\S]*?)<\/h3>/i);
        const title = stripHtml(titleMatch ? titleMatch[1] : "New Development");

        // 3. Extract File Number and Status from the remaining section HTML
        const fileMatch = section.match(
          /(?:File Number|Town Files):?\s*<\/strong>\s*([^<]+)/i,
        );
        const statusMatch = section.match(
          /(?:Status):?\s*<\/strong>\s*([^<]+)/i,
        );

        const fileNumber = fileMatch ? fileMatch[1].trim() : "Unknown";
        const status = statusMatch ? statusMatch[1].trim() : "Under Review";

        // 4. COORDINATE HANDLING:
        // Since we don't have a geocoder here, we 'jitter' the coordinates
        // so they spread out around Milton instead of stacking.
        const jitterLat = (Math.random() - 0.5) * 0.05;
        const jitterLng = (Math.random() - 0.5) * 0.05;

        results.push({
          id: `milton-ward-${pageIdx}-item-${sectionIdx}`,
          title: title,
          type: "New Development",
          status: status.includes("Approved") ? "Approved" : "Under Review",
          urgency: "medium",
          lat: 43.5183 + jitterLat,
          lng: -79.8774 + jitterLng,
          radius: 300,
          summary: `Project: ${title}. File Number: ${fileNumber}. Status: ${status}.`,
          date: now,
          linkedBillId: null,
        });
      });
    });
  } catch (e) {
    console.error("Milton Scraping Error", e);
  }

  // Final fallback if parsing failed completely
  if (results.length === 0) {
    return [
      /* ... keep your existing fallback here ... */
    ];
  }

  return results;
}
/**
 * FEEDS (Meetings)
 */
async function getMiltonFeed(): Promise<FeedItem[]> {
  try {
    const url = "https://calendar.milton.ca/meetings";
    const html = await fetchText(url);

    // Milton URL format: /meetings/Detail/YYYY-MM-DD-HHmm
    const meetingMatches = [
      ...html.matchAll(/\/meetings\/Detail\/([\d-]{10}-[\d]{4})/g),
    ].slice(0, 5);

    return meetingMatches.map((m, i) => {
      const rawDateStr = m[1]; // e.g., "2026-03-24-1900"

      // Convert "2026-03-24-1900" to a format JS understands: "2026-03-24T19:00:00"
      // We split by the last dash to separate the date from the time
      const datePart = rawDateStr.slice(0, 10);
      const timePart = rawDateStr.slice(11);
      const formattedIso = `${datePart}T${timePart.slice(0, 2)}:${timePart.slice(2)}:00`;

      // If the meeting is in the future, it's an "Upcoming" meeting
      // If it's in the past, it's a "Past" meeting
      const meetingDate = new Date(formattedIso);
      const isUpcoming = meetingDate > new Date();

      return {
        id: `milton-mtg-${rawDateStr}-${i}`,
        level: "Municipal",
        type: "meeting",
        title: "Milton Council / Committee Meeting",
        summary: `${isUpcoming ? "Upcoming" : "Recent"} public meeting scheduled for ${datePart} at ${timePart.slice(0, 2)}:${timePart.slice(2)}. Click to view agenda and participation details.`,
        date: meetingDate.toISOString(),
        isNew: isUpcoming,
        urgency: isUpcoming ? "high" : "low",
        linkedBillId: null,
        icon: "🗓️",
      };
    });
  } catch (err) {
    console.error("Milton Feed Error:", err);
    return [];
  }
}

async function getWaterlooFeed(): Promise<FeedItem[]> {
  try {
    // The events portal URL for Waterloo
    const url = "https://events.waterloo.ca/meetings/";
    const html = await fetchText(url);

    // Pattern: /meetings/Detail/2026-03-24-1830-Council-Meeting
    // Group 1: The Date String (YYYY-MM-DD-HHmm)
    // Group 2: The Slug (Meeting-Name)
    const meetingMatches = [
      ...html.matchAll(/\/meetings\/Detail\/([\d-]{15})-([a-zA-Z-]+)/g),
    ].slice(0, 6);

    return meetingMatches.map((m, i) => {
      const rawDateStr = m[1]; // e.g., "2026-03-24-1830"
      const slug = m[2].replace(/-/g, " "); // e.g., "Council Meeting"

      // Parse "2026-03-24-1830" -> "2026-03-24T18:30:00"
      const datePart = rawDateStr.slice(0, 10);
      const timePart = rawDateStr.slice(11);
      const formattedIso = `${datePart}T${timePart.slice(0, 2)}:${timePart.slice(2)}:00`;

      const meetingDate = new Date(formattedIso);
      const isUpcoming = meetingDate > new Date();

      return {
        id: `waterloo-mtg-${rawDateStr}-${i}`,
        level: "Municipal",
        type: "meeting",
        title: `Waterloo: ${slug}`,
        summary: `${isUpcoming ? "Upcoming" : "Recent"} ${slug} scheduled for ${datePart} at ${timePart.slice(0, 2)}:${timePart.slice(2)}.`,
        date: meetingDate.toISOString(),
        isNew: isUpcoming,
        urgency: isUpcoming ? "high" : "medium",
        linkedBillId: null,
        icon: "🗓️",
      };
    });
  } catch (err) {
    console.error("Waterloo Feed Error:", err);
    return [];
  }
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

  // Fetch both "Under Review" and "Approved" Waterloo projects at the same time
  const [underReview, approved] = await Promise.all([
    getWaterlooZoning(),
    getWaterlooApprovedZoning(),
  ]);

  // Combine both arrays into a single list and return it
  return [...underReview, ...approved];
}
