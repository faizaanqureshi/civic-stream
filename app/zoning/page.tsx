"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ZoningAlertCard } from "@/components/map/ZoningAlertCard";
import { useDemoData } from "@/lib/hooks/useDemoData";
import type { ZoningAlertStatus } from "@/types";

// Dynamic import for Leaflet to avoid SSR issues
const ZoningMap = dynamic(
  () => import("@/components/map/ZoningMap").then((mod) => ({ default: mod.ZoningMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function ZoningPage() {
  const { zoningAlerts } = useDemoData();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | ZoningAlertStatus
  >("all");

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listRef = useRef<HTMLDivElement>(null);

  const filteredAlerts =
    statusFilter === "all"
      ? zoningAlerts
      : zoningAlerts.filter((a) => a.status === statusFilter);

  // Scroll to selected card when selection changes
  useEffect(() => {
    if (selectedAlertId && cardRefs.current[selectedAlertId]) {
      cardRefs.current[selectedAlertId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedAlertId]);

  return (
    <div className="h-screen flex flex-col md:flex-row max-w-6xl mx-auto bg-white">
      {/* Map Container */}
      <div className="h-1/2 md:h-full md:flex-1 relative">
        <ZoningMap
          alerts={filteredAlerts}
          selectedId={selectedAlertId}
          onSelectAlert={setSelectedAlertId}
        />

        {/* Map overlay info */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <p className="text-xs font-semibold text-gray-900">Milton, ON</p>
          <p className="text-[10px] text-gray-500">{filteredAlerts.length} alerts</p>
        </div>
      </div>

      {/* Alerts List */}
      <div
        ref={listRef}
        className="h-1/2 md:h-full md:w-96 bg-white border-t md:border-l border-gray-100 overflow-y-auto scroll-smooth"
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-5 z-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Zoning Alerts</h2>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All <span className="text-xs opacity-60">{zoningAlerts.length}</span>
            </button>
            <button
              onClick={() => setStatusFilter("Active")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === "Active"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active <span className="text-xs opacity-60">{zoningAlerts.filter((a) => a.status === "Active").length}</span>
            </button>
            <button
              onClick={() => setStatusFilter("Approved")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === "Approved"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Approved <span className="text-xs opacity-60">{zoningAlerts.filter((a) => a.status === "Approved").length}</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 pb-8">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              ref={(el) => {
                cardRefs.current[alert.id] = el;
              }}
            >
              <ZoningAlertCard
                alert={alert}
                onViewOnMap={() => setSelectedAlertId(alert.id)}
                isSelected={selectedAlertId === alert.id}
              />
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No alerts match your filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
