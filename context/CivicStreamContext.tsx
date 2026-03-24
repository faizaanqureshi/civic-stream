"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import type { CivicStreamState, CivicStreamAction } from "@/types";
const now = new Date().toISOString().split("T")[0];
const initialState: CivicStreamState = {
  postalCode: null,
  riding: null,
  onboardingComplete: false,
  streakDays: 10,
  lastActiveDate: now,
  readBillIds: ["bill-1", "bill-2"],
  earnedBadgeIds: ["watchdog", "delegate", "local-hero"],
  activeFilter: "all",
};

function civicStreamReducer(
  state: CivicStreamState,
  action: CivicStreamAction,
): CivicStreamState {
  switch (action.type) {
    case "SET_POSTAL_CODE":
      return { ...state, postalCode: action.payload };

    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        postalCode: action.payload.postalCode,
        riding: action.payload.riding,
        onboardingComplete: true,
      };

    case "MARK_BILL_READ":
      if (state.readBillIds.includes(action.payload)) {
        return state;
      }
    
      const updatedReadBillIds = [...state.readBillIds, action.payload];
      const updatedEarnedBadgeIds = [...state.earnedBadgeIds];
    
      if (
        updatedReadBillIds.length >= 10 &&
        !updatedEarnedBadgeIds.includes("bill-hawk")
      ) {
        updatedEarnedBadgeIds.push("bill-hawk");
      }
    
      if (
        updatedReadBillIds.length >= 50 &&
        !updatedEarnedBadgeIds.includes("watchdog")
      ) {
        updatedEarnedBadgeIds.push("watchdog");
      }
    
      return {
        ...state,
        readBillIds: updatedReadBillIds,
        earnedBadgeIds: updatedEarnedBadgeIds,
      };
      
    case "SET_FILTER":
      return { ...state, activeFilter: action.payload };

    case "INCREMENT_STREAK":
      return { ...state, streakDays: state.streakDays + 1 };

    case "RESET_DEMO":
      return initialState;

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
