"use client";

import { RepCard } from "@/components/reps/RepCard";
import { useDemoData } from "@/lib/hooks/useDemoData";

export default function RepsPage() {
  const { reps } = useDemoData();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Representatives</h1>
          <p className="text-xs text-gray-400 mt-1">
            {reps.riding}, ON
          </p>
        </div>

        <div className="px-5 py-6 space-y-4 pb-12">
          {reps.reps.map((rep) => (
            <RepCard key={rep.id} rep={rep} />
          ))}
        </div>
      </div>
    </div>
  );
}
