import { useCivicStream } from "@/context/CivicStreamContext";
import { useEffect } from "react";

// ---------------------------------------------------------
// DEMO MODE: Manages streak state via React Context
// PRODUCTION UPGRADE: Replace with:
//   const res = await fetch('/api/user/streak', { method: 'POST' })
//   Backed by Supabase user table with streak calculation
// ---------------------------------------------------------

export function useStreak() {
  const { state, dispatch } = useCivicStream();

  useEffect(() => {
    // Check if we need to increment streak
    const today = new Date().toISOString().split("T")[0];
    const lastActive = state.lastActiveDate;

    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Only increment if last active was yesterday (maintain streak)
      // In demo mode, we don't auto-increment to keep it at 10
      // In production, this would check server-side
    }
  }, [state.lastActiveDate]);

  const daysUntilNextBadge = Math.max(0, 30 - state.streakDays);
  const progressPercent = Math.min(100, (state.streakDays / 30) * 100);

  return {
    streakDays: state.streakDays,
    daysUntilNextBadge,
    progressPercent,
  };
}
