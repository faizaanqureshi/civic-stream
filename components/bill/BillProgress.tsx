"use client";

import { Check } from "lucide-react";
import type { Bill } from "@/types";

interface BillProgressProps {
  bill: Bill;
}

const stages = [
  "First Reading",
  "Second Reading",
  "Committee",
  "Third Reading",
  "Senate",
  "Royal Assent",
];

export function BillProgress({ bill }: BillProgressProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        Legislative Progress
      </h3>
      <div className="space-y-3">
        {stages.slice(0, bill.totalStages).map((stage, idx) => {
          const stageNum = idx + 1;
          const isCompleted = stageNum < bill.statusStage;
          const isCurrent = stageNum === bill.statusStage;

          return (
            <div key={stage} className="flex items-center gap-3">
              {/* Indicator */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isCurrent
                    ? "bg-gray-900 text-white ring-4 ring-gray-200"
                    : isCompleted
                    ? "bg-gray-900 text-white"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{stageNum}</span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-gray-900"
                      : isCompleted
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  {stage}
                </p>
              </div>

              {/* Status badge */}
              {isCurrent && (
                <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
                  Current
                </span>
              )}
              {isCompleted && (
                <span className="text-xs text-gray-400">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
