"use client";

import { useEffect, useState } from "react";
import type { RepsData } from "@/types";
import { normalizePostalCode } from "@/lib/utils/postalCode";

interface RidingState {
  data: RepsData | null;
  loading: boolean;
  error: string | null;
}

export function useRiding(postalCode: string | null) {
  const [state, setState] = useState<RidingState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const normalized = normalizePostalCode(postalCode ?? "");

    if (normalized.length < 6) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await fetch(`/api/reps?postalCode=${normalized}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Unable to load riding data.");
        }

        if (!cancelled) {
          setState({ data: json as RepsData, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load riding data.",
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [postalCode]);

  return state;
}
