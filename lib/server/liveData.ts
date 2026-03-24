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
function buildProvincialSummary(html: string): string {
  // "Current status: ..." from OLA detail pages
  const statusMatch = html.match(/[Cc]urrent\s+status[:\s]+([^<\n]{5,120})/i);
  const status = statusMatch ? statusMatch[1].trim() : null;

  // Sponsor via /members/ link near the top
  const sponsorMatch = html.match(
    /<h1[^>]*>[\s\S]*?<\/h1>[\s\S]*?<a[^>]*href="[^"]*\/members\/[^"]*"[^>]*>([^<]+)<\/a>/i,
  );
  const sponsor = sponsorMatch ? stripHtml(sponsorMatch[1]).trim() : null;

  const parts: string[] = [];
  if (status) parts.push(`Status: ${status}.`);
  if (sponsor) parts.push(`Introduced by ${sponsor}.`);
  parts.push("Ontario Legislative Assembly.");
  return parts.join(" ");
}

export async function getProvincialBills(): Promise<FeedItem[]> {
  try {
    const listingUrl = "https://www.ola.org/en/legislative-business/bills/current";
    const html = await fetchText(listingUrl);
    const baseUrl = "https://www.ola.org";

    type BillStub = { billId: string; title: string; isoDate: string; billUrl: string };
    const stubs: BillStub[] = [];

    // PATTERN 1 — table layout
    const tableRegex =
      /views-field-field-bill-number[^>]*>[\s\S]*?Bill\s*(\d+)[\s\S]*?views-field-field-bill-title[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?datetime="([^"]+)"/gi;
    let match;
    while ((match = tableRegex.exec(html)) !== null && stubs.length < 6) {
      stubs.push({
        billId: match[1],
        billUrl: match[2].startsWith("http") ? match[2] : `${baseUrl}${match[2]}`,
        title: stripHtml(match[3]).trim(),
        isoDate: match[4],
      });
    }

    // PATTERN 2 — list layout fallback
    if (stubs.length === 0) {
      const listRegex =
        /<a[^>]*href="([^"]+)"[^>]*>Bill\s+(\d+),\s+([^<,]+),\s+(\d{4})<\/a>/gi;
      while ((match = listRegex.exec(html)) !== null && stubs.length < 6) {
        const billYear = match[4];
        stubs.push({
          billId: match[2],
          billUrl: match[1].startsWith("http") ? match[1] : `${baseUrl}${match[1]}`,
          title: match[3].trim(),
          isoDate: new Date(`${billYear}-01-01`).toISOString(),
        });
      }
    }

    // Fetch each bill detail page in parallel to get status + sponsor
    const details = await Promise.all(
      stubs.map((s) => fetchText(s.billUrl).catch(() => null)),
    );

    const results: FeedItem[] = stubs.map((s, i) => {
      const detailHtml = details[i];
      const summary = detailHtml
        ? buildProvincialSummary(detailHtml)
        : "Active legislative business in the Ontario Assembly.";

      return {
        id: `prov-bill-2026-${s.billId}`,
        level: "Provincial",
        type: "bill",
        title: `Bill ${s.billId}: ${s.title}`,
        summary,
        date: s.isoDate,
        url: s.billUrl,
        isNew: true,
        urgency: "medium",
        linkedBillId: s.billId,
        icon: "🏛️",
      } as FeedItem;
    });

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
