"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedItem } from "@/components/feed/FeedItem";
import { FeedFilter } from "@/components/feed/FeedFilter";
import { StreakBanner } from "@/components/gamification/StreakBanner";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useDemoData } from "@/lib/hooks/useDemoData";
import { Loader2 } from "lucide-react";

const BREAKING_ITEM = {
  id: "feed-breaking",
  level: "Municipal" as const,
  type: "budget" as const,
  title: "Milton Town Council Approves 2025 Budget",
  summary:
    "Council voted 6-3 to approve $387M operating budget with 4.2% tax increase. Includes new community center funding.",
  date: new Date().toISOString(),
  isNew: true,
  urgency: "high" as const,
  linkedBillId: null,
  icon: "💰",
};

export default function FeedPage() {
  const { state } = useCivicStream();
  const { feed: feedData } = useDemoData();
  const [isLoading, setIsLoading] = useState(true);
  const [showBreaking, setShowBreaking] = useState(false);

  useEffect(() => {
    // Simulate pull-to-refresh check
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        setShowBreaking(true);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const filteredFeed =
    state.activeFilter === "all"
      ? feedData
      : feedData.filter((item) => item.level === state.activeFilter);

  const allFeedItems = showBreaking
    ? [BREAKING_ITEM, ...filteredFeed]
    : filteredFeed;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-6 space-y-6">
        {/* Streak Banner */}
        <StreakBanner />

        {/* Filters */}
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Filter
          </h2>
          <FeedFilter allItems={feedData} />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Feed Items */}
        {!isLoading && (
          <div className="space-y-3 pb-8">
            <AnimatePresence mode="popLayout">
              {allFeedItems.map((item, index) => (
                <FeedItem key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allFeedItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">No items match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
