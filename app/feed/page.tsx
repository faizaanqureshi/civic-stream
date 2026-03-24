"use client";

import { AnimatePresence } from "framer-motion";
import { FeedItem } from "@/components/feed/FeedItem";
import { FeedFilter } from "@/components/feed/FeedFilter";
import { StreakBanner } from "@/components/gamification/StreakBanner";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useMunicipalFeed } from "@/lib/hooks/useMunicipalFeed";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function FeedPage() {
  const { state } = useCivicStream();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error } = useMunicipalFeed(state.postalCode);
  const feedData = data?.feed ?? [];

  const filteredFeed =
    state.activeFilter === "all"
      ? feedData
      : feedData.filter((item) => item.level === state.activeFilter);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F9B7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 py-6 space-y-6">
        <StreakBanner />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Filter
            </h2>
            {data?.municipality && (
              <span className="text-xs text-gray-400">{data.municipality}</span>
            )}
          </div>
          <FeedFilter allItems={feedData} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3 pb-8">
            <AnimatePresence mode="popLayout">
              {filteredFeed.map((item, index) => (
                <FeedItem key={item.id} item={item} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && !error && filteredFeed.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-gray-500">No items match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
