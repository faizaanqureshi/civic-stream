"use client";

import { useStreak } from "@/lib/hooks/useStreak";

export function StreakBanner() {
  const { streakDays, progressPercent } = useStreak();

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Civic Streak</p>
          <p className="text-3xl font-bold text-gray-900">{streakDays}</p>
          <p className="text-xs text-gray-500 mt-0.5">days</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Goal</p>
          <p className="text-2xl font-bold text-gray-300">30</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span className="font-medium text-gray-900">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
