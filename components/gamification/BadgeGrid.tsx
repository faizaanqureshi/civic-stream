"use client";

import * as LucideIcons from "lucide-react";
import type { Badge } from "@/types";

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const getIconComponent = (iconName: string) => {
    const iconKey = iconName
      .split("-")
      .map((word, idx) =>
        idx === 0
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("");

    // Map common icon names
    const iconMap: { [key: string]: string } = {
      dog: "Dog",
      "clipboard-check": "ClipboardCheck",
      "building-2": "Building2",
      eye: "Eye",
      "dollar-sign": "DollarSign",
      flame: "Flame",
    };

    const mappedName = iconMap[iconName] || iconKey;
    const Icon =
      LucideIcons[mappedName as keyof typeof LucideIcons] ||
      LucideIcons.Award;

    return Icon as React.ComponentType<{ className?: string }>;
  };

  const getBadgeColor = (badgeId: string) => {
    const colors: { [key: string]: string } = {
      watchdog: "bg-blue-500",
      delegate: "bg-purple-500",
      "local-hero": "bg-green-500",
      informed: "bg-orange-500",
      engaged: "bg-pink-500",
      "30-day": "bg-indigo-500",
    };
    return colors[badgeId] || "bg-gray-900";
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map((badge) => {
        const Icon = getIconComponent(badge.icon);
        const badgeColor = getBadgeColor(badge.id);
        return (
          <div
            key={badge.id}
            className={`bg-white border border-gray-100 rounded-xl p-4 text-center ${
              badge.earned ? "" : "opacity-40"
            }`}
          >
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
                badge.earned
                  ? `${badgeColor} text-white`
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <Icon className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-xs text-gray-900 mb-1">
              {badge.name}
            </h4>
            <p className="text-xs text-gray-500 leading-tight">
              {badge.description}
            </p>
            {badge.earned && badge.earnedDate && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(badge.earnedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
            {!badge.earned && (
              <p className="text-xs text-gray-400 mt-2">Locked</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
