"use client";

import { RepCard } from "@/components/reps/RepCard";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useRiding } from "@/lib/hooks/useRiding";

export default function RepsPage() {
  const { state } = useCivicStream();
  const { data, loading, error } = useRiding(state.postalCode);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Representatives</h1>
          <p className="text-xs text-gray-400 mt-1">
            {data?.riding || state.riding || "Not set"}
          </p>
        </div>

        <div className="px-5 py-6 space-y-4 pb-12">
          {loading && <p className="text-sm text-gray-500">Loading representatives...</p>}
          {error && <p className="text-sm text-amber-700">{error}</p>}
          {!loading && !error && data?.reps.map((rep) => (
            <RepCard key={rep.id} rep={rep} />
          ))}
        </div>
      </div>
    </div>
  );
}
