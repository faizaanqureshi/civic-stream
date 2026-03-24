"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import type { CivicStreamState, CivicStreamAction } from "@/types";
import { createClient } from "@/lib/supabase/client";
const now = new Date().toISOString().split("T")[0];
const initialState: CivicStreamState = {
  postalCode: null,
  riding: null,
  onboardingComplete: false,
  streakDays: 5,
  lastActiveDate: now,
  readBillIds: [],
  earnedBadgeIds: [],
  activeFilter: "all",
  activities: [],
  externalClickUrls: [],
  points: 0,
  zoningClickIds: [],
  lastCelebratedLevel: 1,
};

const supabase = createClient();

function civicStreamReducer(
  state: CivicStreamState,
  action: CivicStreamAction,
): CivicStreamState {
  // Helper for timestamping
  const now = new Date().toISOString();

  switch (action.type) {
    case "SYNC_FROM_SUPABASE":
      // Merge existing state with Supabase data, ensuring arrays aren't undefined
      return {
        ...state,
        ...action.payload,
        readBillIds: action.payload.readBillIds || [],
        zoningClickIds: action.payload.zoningClickIds || [],
        externalClickUrls: action.payload.externalClickUrls || [],
        earnedBadgeIds: action.payload.earnedBadgeIds || [],
        activities: (action.payload.activities || []).slice(0, 5),
      };

    case "MARK_BILL_READ": {
      if (state.readBillIds.includes(action.payload)) return state;

      const updatedReadBillIds = [...state.readBillIds, action.payload];
      const pointsEarned = 10;

      const newActivity = {
        id: `bill-${Date.now()}`,
        action: `Earned 10pts: Read bill ${action.payload}`,
        time: now,
      };

      return {
        ...state,
        points: (state.points || 0) + pointsEarned,
        readBillIds: updatedReadBillIds,
        activities: [newActivity, ...(state.activities || [])].slice(0, 5),
      };
    }

    case "TRACK_ZONING_CLICK": {
      if (state.zoningClickIds?.includes(action.payload)) return state;

      const updatedZoningIds = [
        ...(state.zoningClickIds || []),
        action.payload,
      ];
      const pointsEarned = 5;

      const newActivity = {
        id: `zone-${Date.now()}`,
        action: `Earned 5pts: Viewed Zoning Alert`,
        time: now,
      };

      return {
        ...state,
        points: (state.points || 0) + pointsEarned,
        zoningClickIds: updatedZoningIds,
        activities: [newActivity, ...(state.activities || [])].slice(0, 5),
      };
    }

    case "TRACK_EXTERNAL_CLICK": {
      if (state.externalClickUrls?.includes(action.payload)) return state;

      const updatedUrls = [...(state.externalClickUrls || []), action.payload];
      const pointsEarned = 5;

      const newActivity = {
        id: `ext-${Date.now()}`,
        action: `Earned 5pts: Explored external source`,
        time: now,
      };

      return {
        ...state,
        points: (state.points || 0) + pointsEarned,
        externalClickUrls: updatedUrls,
        activities: [newActivity, ...(state.activities || [])].slice(0, 5),
      };
    }

    case "SET_POSTAL_CODE":
      return { ...state, postalCode: action.payload };

    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        postalCode: action.payload.postalCode,
        riding: action.payload.riding,
        onboardingComplete: true,
      };

    case "SET_FILTER":
      return { ...state, activeFilter: action.payload };

    case "INCREMENT_STREAK":
      return { ...state, streakDays: (state.streakDays || 0) + 1 };

    case "RESET_DEMO":
      return initialState;

    case "ACKNOWLEDGE_LEVEL_UP":
      return {
        ...state,
        lastCelebratedLevel: action.payload,
      };

    default:
      return state;
  }
}

interface CivicStreamContextType {
  state: CivicStreamState;
  dispatch: React.Dispatch<CivicStreamAction>;
}

const CivicStreamContext = createContext<CivicStreamContextType | undefined>(
  undefined,
);

export function CivicStreamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    civicStreamReducer,
    initialState,
    (initial) => {
      // Try to load from localStorage on client
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("civicStreamState");
        if (saved) {
          try {
            return { ...initial, ...JSON.parse(saved) };
          } catch {
            return initial;
          }
        }
      }
      return initial;
    },
  );

  // Persist to localStorage on state change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("civicStreamState", JSON.stringify(state));
    }
  }, [state]);

  return (
    <CivicStreamContext.Provider value={{ state, dispatch }}>
      {children}
    </CivicStreamContext.Provider>
  );
}

export function useCivicStream() {
  const context = useContext(CivicStreamContext);
  if (context === undefined) {
    throw new Error("useCivicStream must be used within a CivicStreamProvider");
  }
  return context;
}
