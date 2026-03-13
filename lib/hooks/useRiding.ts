import { useDemoData } from "./useDemoData";
import type { RepsData } from "@/types";

// ---------------------------------------------------------
// DEMO MODE: Returns fixture data from /data/reps.json
// PRODUCTION UPGRADE: Replace with:
//   const res = await fetch('/api/riding?postal=' + postalCode)
//   Using Represent API: https://represent.opennorth.ca/
// ---------------------------------------------------------

export function useRiding(postalCode: string | null): RepsData | null {
  const { reps } = useDemoData();

  if (!postalCode) {
    return null;
  }

  // In demo mode, always return Milton data for L9T
  if (postalCode.toUpperCase().startsWith("L9T")) {
    return reps;
  }

  // In production, this would fetch from API
  return reps;
}
