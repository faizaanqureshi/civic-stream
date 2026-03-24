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
    // session=45-1 pins to current parliament
    const url = `${baseUrl}/bills/?format=json&limit=10&order_by=-introduced&session=45-1`;
    const data = await fetchJson<any>(url);

    if (!data?.objects) return [];

    // Fetch detail for each bill in parallel to get status, chamber, sponsor, etc.
    // C-1 is excluded as it's a pro forma procedural bill introduced every session
    const details = await Promise.all(
      data.objects.filter((bill: any) => bill.number !== "C-1").slice(0, 5).map((bill: any) =>
        fetchJson<any>(`${baseUrl}${bill.url}?format=json`).catch(() => null)
      )
    );

    return details
      .filter((detail): detail is NonNullable<typeof detail> => detail !== null)
      .map((detail) => {
        const billNumber = detail.number || "Unknown";
        const billTitle = detail.name?.en || "Legislative Measure";
        const shortTitle = detail.short_title?.en;
        const status = detail.status?.en || "Under Consideration";
        const isLaw = detail.law === true;
        const chamber =
          detail.home_chamber === "HoC" ? "House of Commons" : "the Senate";
        const isPrivateMember = detail.private_member_bill === true;
        const detailUrl = `${baseUrl}${detail.url}`;

        const summaryParts = [
          `Status: ${status}.`,
          `Introduced in the ${chamber}`,
          isPrivateMember ? "(private member's bill)" : "(government bill)",
          isLaw ? "— now law." : ".",
        ];

        return {
          id: `fed-bill-${billNumber}-${detail.session}`,
          level: "Federal",
          type: "bill",
          title: `Bill ${billNumber}: ${shortTitle || billTitle}`,
          summary: summaryParts.join(" "),
          date: detail.introduced
            ? new Date(detail.introduced).toISOString()
            : new Date().toISOString(),
          url: detailUrl,
          isNew: !isLaw,
          urgency: isLaw ? ("low" as const) : ("high" as const),
          linkedBillId: billNumber,
          icon: "🇨🇦",
          status,
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
