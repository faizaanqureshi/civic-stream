import billsData from "@/data/bills.json";
import type {
  Bill,
  FeedItem,
  SupportedMunicipality,
  ZoningAlert,
} from "@/types";
import { MUNICIPALITY_CONFIG } from "@/lib/server/municipalities";
import {
  fetchJson,
  fetchText,
  getMunicipalFeed,
  getMunicipalZoning,
  stripHtml,
} from "@/lib/server/municipalLive";

const bills = billsData as Bill[];

function getSharedLegislationFeed(
  municipality: SupportedMunicipality,
): FeedItem[] {
  const localBillFilter =
    municipality === "Milton"
      ? (bill: Bill) => bill.affectsMilton
      : (bill: Bill) => bill.level !== "Municipal";

  return bills
    .filter(localBillFilter)
    .slice(0, 4)
    .map((bill) => {
      const urgency: "high" | "medium" =
        bill.level === "Municipal" ? "high" : "medium";

      return {
        id: `bill-feed-${bill.id}`,
        level: bill.level,
        type: "bill" as const,
        title: `${bill.billNumber}: ${bill.shortTitle}`,
        summary: bill.gist,
        date: bill.publishedDate,
        isNew: false,
        urgency,
        linkedBillId: bill.id,
        icon:
          bill.level === "Federal"
            ? "🏛️"
            : bill.level === "Provincial"
              ? "📘"
              : "📍",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * FEDERAL (Canada)
 * Fixed: Added sorting and safe property access
 */
export async function getFederalBills(): Promise<FeedItem[]> {
  const baseUrl = "https://openparliament.ca";
  try {
    // order_by=-introduced ensures we get 2026/2025 bills
    const url = `${baseUrl}/bills/?format=json&limit=5&order_by=-introduced`;
    const data = await fetchJson<any>(url);

    if (!data?.objects) return [];

    return data.objects.map((bill: any) => {
      const billNumber = bill.number || "Unknown";
      const billTitle = bill.name?.en || "Legislative Measure";
      const status = bill.status?.en || "Under Consideration";
      const chamber =
        bill.chamber === "hoc" ? "House of Commons" : "the Senate";

      // Construct the full URL using the relative 'url' field from the API
      // If the API field is missing, we use a fallback pattern
      const detailUrl = bill.url
        ? `${baseUrl}${bill.url}`
        : `${baseUrl}/bills/${bill.session}/${billNumber}/`;

      return {
        id: `fed-bill-${billNumber}-${bill.session}`,
        level: "Federal",
        type: "bill",
        title: `Bill ${billNumber}: ${billTitle}`,
        summary: `Current status: ${status}. This federal bill is currently before ${chamber}.`,
        // Fix: Use the actual introduction date for the feed timestamp
        date: bill.introduced
          ? new Date(bill.introduced).toISOString()
          : new Date().toISOString(),
        url: detailUrl, // Fixed: Link included here
        isNew: true,
        urgency: "high",
        linkedBillId: billNumber,
        icon: "🇨🇦",
      };
    });
  } catch (err) {
    console.error("Fed Fetch Error", err);
    return [];
  }
}

/**
 * PROVINCIAL (Ontario)
 * Fixed: Updated to a more stable URL for 2026
 */
export async function getProvincialBills(): Promise<FeedItem[]> {
  try {
    const url = "https://www.ola.org/en/legislative-business/bills/current";
    const html = await fetchText(url);
    const results: FeedItem[] = [];
    const baseUrl = "https://www.ola.org";

    /**
     * PATTERN 1: The "List/Heading" format
     * Updated to capture the anchor tag to get the relative URL
     */
    const listRegex =
      /<a[^>]*href="([^"]+)"[^>]*>Bill\s+(\d+),\s+([^<,]+),\s+(\d{4})<\/a>/gi;

    /**
     * PATTERN 2: The "Table" format
     * Updated to capture the link (match[2]) from the title cell
     */
    const tableRegex =
      /views-field-field-bill-number[^>]*>[\s\S]*?Bill\s*(\d+)[\s\S]*?views-field-field-bill-title[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?datetime="([^"]+)"/gi;

    let match;

    // Try Table Pattern first
    while ((match = tableRegex.exec(html)) !== null && results.length < 6) {
      const billId = match[1];
      const relativeLink = match[2];
      const title = stripHtml(match[3]).trim();
      const isoDate = match[4];

      results.push({
        id: `prov-bill-2026-${billId}`,
        level: "Provincial",
        type: "bill",
        title: `Bill ${billId}: ${title}`,
        summary: "Active legislative business in the Ontario Assembly.",
        date: isoDate,
        url: relativeLink.startsWith("http")
          ? relativeLink
          : `${baseUrl}${relativeLink}`,
        isNew: true,
        urgency: "medium",
        linkedBillId: billId,
        icon: "🏛️",
      });
    }

    // Fallback to List Pattern 1 if no table matches
    if (results.length === 0) {
      while ((match = listRegex.exec(html)) !== null && results.length < 6) {
        const relativeLink = match[1];
        const billNumber = match[2];
        const billTitle = match[3].trim();
        const billYear = match[4];

        results.push({
          id: `prov-bill-2026-${billNumber}`,
          level: "Provincial",
          type: "bill",
          title: `Bill ${billNumber}: ${billTitle}`,
          summary: `Introduced in the ${billYear} legislative session.`,
          date: new Date(`${billYear}-01-01`).toISOString(),
          url: relativeLink.startsWith("http")
            ? relativeLink
            : `${baseUrl}${relativeLink}`,
          isNew: true,
          urgency: "medium",
          linkedBillId: billNumber,
          icon: "🏛️",
        });
      }
    }

    console.log(`Successfully parsed ${results.length} provincial bills.`);
    console.log("bills");
    console.log(results);
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error("Provincial Fetch Error:", err);
    return [];
  }
}

export async function getMunicipalityFeed(
  municipality: SupportedMunicipality,
): Promise<FeedItem[]> {
  const municipalFeed = await getMunicipalFeed(municipality);
  const legislationFeed = getSharedLegislationFeed(municipality);

  return [...municipalFeed, ...legislationFeed]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
}
export async function getMunicipalityZoningAlerts(
  municipality: SupportedMunicipality,
): Promise<{ alerts: ZoningAlert[]; center: [number, number] }> {
  const config = MUNICIPALITY_CONFIG[municipality];
  const alerts = await getMunicipalZoning(municipality);
  console.log("printing out alerts");
  console.log(alerts);
  console.log("printing out config");
  console.log(config);
  return {
    alerts,
    center: config.zoningCenter,
  };
}
