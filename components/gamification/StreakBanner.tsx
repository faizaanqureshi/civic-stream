"use client";

import { useCivicStream } from "@/context/CivicStreamContext";

export function StreakBanner() {
  const { state } = useCivicStream();
  const streakDays = state.streakDays || 0;

  // Dynamic Milestones
  const milestones = [3, 7, 14, 30, 60, 100, 365];

  // Find the next milestone that is strictly greater than the current streak
  const nextGoal =
    milestones.find((m) => m > streakDays) || milestones[milestones.length - 1];

  // Calculate specific progress toward THIS milestone
  // E.g. if streak is 4 and goal is 7, it's (4/7) * 100
  const progressPercent = Math.min((streakDays / nextGoal) * 100, 100);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Civic Streak</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-gray-900">{streakDays}</p>
            <p className="text-xs text-gray-500 font-medium">days</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Next Milestone</p>
          <p className="text-2xl font-bold text-gray-300">{nextGoal}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span className="font-medium text-gray-900">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
