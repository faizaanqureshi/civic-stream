import badgeDefinitions from "@/data/badges.json";
import type { Badge } from "@/types";

export function getBadgesForUser(
  earnedBadgeIds: string[] = []
): Badge[] {
  return badgeDefinitions.map((badge) => ({
    ...badge,
    earned: earnedBadgeIds.includes(badge.id),
    earnedDate: null,
  }));
}
