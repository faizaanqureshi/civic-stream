"use client";

import { useState, useEffect } from "react"; // 1. Import these
import { RepCard } from "@/components/reps/RepCard";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useRiding } from "@/lib/hooks/useRiding";
import { Loader2 } from "lucide-react"; // Nice to have for loading

export default function RepsPage() {
  const { state } = useCivicStream();
  const { data, loading, error } = useRiding(state.postalCode);

  // 2. Add the mounted state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 3. Prevent the mismatch by rendering a consistent shell until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Representatives</h1>
          <div className="h-4 w-24 bg-gray-100 animate-pulse rounded mt-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Representatives</h1>
          <p className="text-xs text-gray-400 mt-1">
            {/* Now safe to render because we are definitely on the client */}
            {data?.riding || state.riding || "Location not found"}
          </p>
        </div>

        <div className="px-5 py-6 space-y-4 pb-12">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0F9B7A]" />
            </div>
          )}
          {error && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              {error}
            </p>
          )}
          {!loading &&
            !error &&
            data?.reps.map((rep) => <RepCard key={rep.id} rep={rep} />)}
        </div>
      </div>
    </div>
  );
}
