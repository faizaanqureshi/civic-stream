import { Plus, Minus } from "lucide-react";
import type { Bill } from "@/types";

interface ForAgainstPanelProps {
  bill: Bill;
}

export function ForAgainstPanel({ bill }: ForAgainstPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Debate</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* For Column */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">
              Arguments For
            </h4>
          </div>
          <ul className="space-y-3">
            {bill.forArguments.map((arg, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-green-600 font-bold text-sm mt-0.5">
                  •
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {arg}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Against Column */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <Minus className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">
              Arguments Against
            </h4>
          </div>
          <ul className="space-y-3">
            {bill.againstArguments.map((arg, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-red-600 font-bold text-sm mt-0.5">
                  •
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {arg}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
