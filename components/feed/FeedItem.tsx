"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "@/lib/utils/formatDate";
import { ChevronRight } from "lucide-react";
import type { FeedItem as FeedItemType } from "@/types";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useCivicActions } from "@/lib/hooks/useCivicActions";

interface FeedItemProps {
  item: FeedItemType;
  index: number;
}

export function FeedItem({ item, index }: FeedItemProps) {
  const router = useRouter();
  const { dispatch } = useCivicStream();
  const { trackBillRead } = useCivicActions();

  const handleClick = () => {
    if (item.linkedBillId) {
      dispatch({ type: "MARK_BILL_READ", payload: item.linkedBillId });
      trackBillRead(item.linkedBillId, item.title);
      const params = new URLSearchParams({
        title: item.title,
        summary: item.summary,
        level: item.level,
        date: item.date,
        ...(item.status && { status: item.status }),
        ...(item.url && { sourceUrl: item.url }),
        icon: item.icon,
      });
      router.push(
        `/bill/${encodeURIComponent(item.linkedBillId)}?${params.toString()}`,
      );
    } else if (item.url) {
      dispatch({ type: "TRACK_EXTERNAL_CLICK", payload: item.url });
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else if (item.type === "alert") {
      router.push("/zoning");
    }
  };

  const getLevelColors = (level: string) => {
    const colors: {
      [key: string]: { border: string; bg: string; text: string };
    } = {
      Federal: {
        border: "border-l-red-200",
        bg: "bg-red-50/30",
        text: "text-red-600",
      },
      Provincial: {
        border: "border-l-blue-200",
        bg: "bg-blue-50/30",
        text: "text-blue-600",
      },
      Municipal: {
        border: "border-l-green-200",
        bg: "bg-green-50/30",
        text: "text-green-600",
      },
    };
    return (
      colors[level] || {
        border: "border-l-gray-200",
        bg: "bg-white",
        text: "text-gray-600",
      }
    );
  };

  const levelColors = getLevelColors(item.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}>
      <div
        onClick={handleClick}
        className={`${levelColors.bg} border border-gray-100 ${levelColors.border} border-l-4 rounded-xl p-5 hover:border-gray-200 transition-all duration-200 cursor-pointer group`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium ${levelColors.text}`}>
                {item.level}
              </span>
              {item.isNew && (
                <span className="px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
                  New
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">
              {item.title}
            </h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
          {item.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          <span>{formatRelativeDate(item.date)}</span>
          <span>•</span>
          <span className="capitalize">{item.type}</span>
          {item.status && (
            <>
              <span>•</span>
              <span
                className={`font-medium ${item.urgency === "low" ? "text-green-600" : "text-amber-600"}`}>
                {item.status}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
