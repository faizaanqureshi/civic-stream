"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, MapPin, Users, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: MapPin, label: "Map", path: "/zoning" },
    { icon: Users, label: "Reps", path: "/reps" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = pathname === path.split("?")[0];

            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className="flex flex-col items-center gap-1.5 transition-colors min-w-[60px]"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        {/* iPhone home indicator */}
        <div className="h-5 flex items-center justify-center">
          <div className="w-32 h-1 bg-gray-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}
