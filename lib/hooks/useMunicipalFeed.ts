"use client";

import { useEffect, useState } from "react";
import type { FeedItem, SupportedMunicipality } from "@/types";

interface MunicipalFeedResponse {
  municipality: SupportedMunicipality;
  feed: FeedItem[];
}

export function useMunicipalFeed(postalCode: string | null) {
  const [data, setData] = useState<MunicipalFeedResponse | null>(null);
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
        const response = await fetch(`/api/feed?postalCode=${postalCode}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Unable to load feed");
        }

        if (!cancelled) {
          setData(json as MunicipalFeedResponse);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Unable to load feed");
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
