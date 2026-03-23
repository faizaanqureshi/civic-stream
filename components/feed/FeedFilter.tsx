"use client";

import { useCivicStream } from "@/context/CivicStreamContext";
import type { FeedItem } from "@/types";

interface FeedFilterProps {
  allItems: FeedItem[];
}

export function FeedFilter({ allItems }: FeedFilterProps) {
  const { state, dispatch } = useCivicStream();

  const filters = [
    { label: "All", value: "all" as const },
    { label: "Federal", value: "Federal" as const },
    { label: "Provincial", value: "Provincial" as const },
    { label: "Municipal", value: "Municipal" as const },
  ];

  const getCounts = () => {
    return {
      all: allItems.length,
      Federal: allItems.filter((i) => i.level === "Federal").length,
      Provincial: allItems.filter((i) => i.level === "Provincial").length,
      Municipal: allItems.filter((i) => i.level === "Municipal").length,
    };
  };

  const counts = getCounts();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const isActive = state.activeFilter === filter.value;
        const count = counts[filter.value];

        return (
          <button
            key={filter.value}
            onClick={() => dispatch({ type: "SET_FILTER", payload: filter.value })}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter.label}
            <span className="text-xs opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
