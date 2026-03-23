import billsData from "@/data/bills.json";
import type {
  Bill,
  FeedItem,
  SupportedMunicipality,
  ZoningAlert,
} from "@/types";
import { MUNICIPALITY_CONFIG } from "@/lib/server/municipalities";
import {
  getMunicipalFeed,
  getMunicipalZoning,
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

  return {
    alerts,
    center: config.zoningCenter,
  };
}
