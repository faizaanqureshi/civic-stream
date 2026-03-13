import repsData from "@/data/reps.json";
import billsData from "@/data/bills.json";
import feedData from "@/data/feed.json";
import zoningAlertsData from "@/data/zoningAlerts.json";
import badgesData from "@/data/badges.json";

import type { RepsData, Bill, FeedItem, ZoningAlert, Badge } from "@/types";

// ---------------------------------------------------------
// DEMO MODE: Returns fixture data from /data/*.json
// PRODUCTION UPGRADE: Replace with:
//   const res = await fetch('/api/[endpoint]?postal=' + postalCode)
//   Backed by Cloudflare Worker -> real API or Supabase query
// ---------------------------------------------------------

export const DEMO_MODE = true;

export function useDemoData() {
  const reps = repsData as RepsData;
  const bills = billsData as Bill[];
  const feed = feedData as FeedItem[];
  const zoningAlerts = zoningAlertsData as ZoningAlert[];
  const badges = badgesData as Badge[];

  return {
    reps,
    bills,
    feed,
    zoningAlerts,
    badges,
  };
}
