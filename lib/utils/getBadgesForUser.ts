import badgeDefinitions from "@/data/badges.json";
import type { Badge } from "@/types";

interface EarnedBadgeMap {
  [badgeId: string]: string | null;
}

export function getBadgesForUser(
  earnedBadges: EarnedBadgeMap = {}
): Badge[] {
  return badgeDefinitions.map((badge) => {
    const earnedDate = earnedBadges[badge.id] ?? null;

    return {
      ...badge,
      earned: !!earnedDate,
      earnedDate,
    };
  });
}
