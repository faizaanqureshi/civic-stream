"use client";

import { Mail, ChevronRight } from "lucide-react";
import type { Rep } from "@/types";

interface RepCardProps {
  rep: Rep;
}

export function RepCard({ rep }: RepCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getLevelColors = (level: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string; badge: string } } = {
      Federal: {
        bg: "bg-red-50/40",
        border: "border-red-100/60 border-l-red-300 border-l-4",
        text: "text-red-600",
        badge: "bg-red-50 text-red-600 border-red-100"
      },
      Provincial: {
        bg: "bg-blue-50/40",
        border: "border-blue-100/60 border-l-blue-300 border-l-4",
        text: "text-blue-600",
        badge: "bg-blue-50 text-blue-600 border-blue-100"
      },
      Municipal: {
        bg: "bg-green-50/40",
        border: "border-green-100/60 border-l-green-300 border-l-4",
        text: "text-green-600",
        badge: "bg-green-50 text-green-600 border-green-100"
      },
    };
    return colors[level] || { bg: "bg-white", border: "border-gray-100", text: "text-gray-900", badge: "bg-gray-100 text-gray-600 border-gray-200" };
  };

  const levelColors = getLevelColors(rep.level);

  return (
    <div className={`${levelColors.bg} border ${levelColors.border} rounded-xl p-5`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        {rep.photo ? (
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-white ring-2 ring-white shadow-sm">
            <img
              src={rep.photo}
              alt={rep.name}
              className="w-full h-full object-cover object-center scale-110"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-600 font-bold text-xl flex-shrink-0 ring-2 ring-white shadow-sm">
            {getInitials(rep.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {rep.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{rep.title}</p>
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-3.5 mb-5 pl-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Party</span>
          <span className="text-sm text-gray-900 font-medium">{rep.party}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Level</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${levelColors.badge}`}>
            {rep.level}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Attendance</span>
          <span className="text-sm text-gray-900 font-medium">{rep.attendance}%</span>
        </div>
      </div>

      {/* Email Link */}
      <a
        href={`mailto:${rep.email}`}
        className="flex items-center justify-between w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-gray-200 text-gray-900 text-sm font-medium rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span>Send email</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
      </a>
    </div>
  );
}
