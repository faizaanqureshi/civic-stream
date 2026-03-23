"use client";

import { useEffect, useState } from "react";
import type { SupportedMunicipality, ZoningAlert } from "@/types";

interface ZoningResponse {
  municipality: SupportedMunicipality;
  alerts: ZoningAlert[];
  center: [number, number];
}

export function useZoningAlerts(postalCode: string | null) {
  const [data, setData] = useState<ZoningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postalCode) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/zoning?postalCode=${postalCode}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Unable to load zoning alerts");
        }

        if (!cancelled) {
          setData(json as ZoningResponse);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Unable to load zoning alerts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [postalCode]);

  return { data, loading, error };
}
