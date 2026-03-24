"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { useCivicStream } from "@/context/CivicStreamContext";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric?: string;
  target?: number;
  color?: string;
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { state } = useCivicStream();

  // 1. Map current user state to badge requirements
  const getCurrentProgress = (metric?: string) => {
    switch (metric) {
      case "bills":
        return state.readBillIds?.length || 0;
      case "zoning":
        return state.zoningClickIds?.length || 0;
      case "links":
        return state.externalClickUrls?.length || 0;
      case "streak":
        return state.streakDays || 0;
      default:
        return 0;
    }
  };

  const getIconComponent = (iconName: string) => {
    // Basic camelCase conversion
    const iconKey = iconName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const Icon = (LucideIcons as any)[iconKey] || LucideIcons.Award;
    return Icon;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map((badge) => {
        const Icon = getIconComponent(badge.icon);
        const currentProgress = getCurrentProgress(badge.metric);
        const target = badge.target || 1;

        // 2. Determine if earned: check if target is met OR if ID is in the Supabase sync
        const hasMetTarget = currentProgress >= target;
        const isEarned =
          state.earnedBadgeIds?.includes(badge.id) || hasMetTarget;

        const percentComplete = Math.min((currentProgress / target) * 100, 100);
        const badgeColor = badge.color || "bg-teal-600";

        return (
          <div
            key={badge.id}
            className={`bg-white border border-gray-100 rounded-xl p-4 text-center transition-all duration-300 ${
              isEarned ? "shadow-sm border-teal-100" : "opacity-70"
            }`}>
            {/* Icon Container */}
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${
                isEarned
                  ? `${badgeColor} text-white`
                  : "bg-gray-100 text-gray-400"
              }`}>
              <Icon className="w-7 h-7" />
            </div>

            <h4 className="font-bold text-[13px] text-gray-900 mb-1 leading-tight">
              {badge.name}
            </h4>
            <p className="text-[10px] text-gray-500 leading-tight mb-4 min-h-[24px]">
              {badge.description}
            </p>

            {/* Progress Section */}
            <div className="space-y-1.5 mt-auto">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                <span className="text-gray-400">Progress</span>
                <span className={isEarned ? "text-teal-600" : "text-gray-900"}>
                  {currentProgress} / {target}
                </span>
              </div>

              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    isEarned ? "bg-teal-500" : badgeColor
                  }`}
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            {isEarned && (
              <p className="mt-2 text-[9px] font-black text-teal-600 uppercase tracking-widest">
                Unlocked
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
