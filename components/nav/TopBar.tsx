"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useCivicStream } from "@/context/CivicStreamContext";

export function TopBar() {
  const { state } = useCivicStream();
  const [mounted, setMounted] = useState(false);

  // This effect only runs on the client after the first render
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-40">
      <div className="max-w-md mx-auto px-5 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CivicStream</h1>

            {/* By checking 'mounted', we ensure the server and the client 
                both render NOTHING here initially. Once the client "wakes up", 
                it will show the riding info.
            */}
            {mounted && state.onboardingComplete && state.riding && (
              <p className="text-xs text-gray-500 mt-0.5">
                {state.riding} · {state.postalCode}
              </p>
            )}

            {/* Optional: If you don't want the layout to "jump" 
                when the text appears, you can add a fixed-height div.
            */}
            {!mounted && <div className="h-4" />}
          </div>

          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-gray-600" strokeWidth={2} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gray-900 rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
}
