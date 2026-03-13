"use client";

import { useRouter } from "next/navigation";
import { Bell, Mail, Trash2, User } from "lucide-react";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ActivityFeed } from "@/components/gamification/ActivityFeed";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useStreak } from "@/lib/hooks/useStreak";
import { useDemoData } from "@/lib/hooks/useDemoData";

export default function ProfilePage() {
  const router = useRouter();
  const { state, dispatch } = useCivicStream();
  const { streakDays, daysUntilNextBadge, progressPercent } = useStreak();
  const { badges, reps } = useDemoData();

  const handleResetDemo = () => {
    if (confirm("Reset demo and return to onboarding?")) {
      dispatch({ type: "RESET_DEMO" });
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-10 px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {state.riding}, ON · {state.postalCode}
          </p>
        </div>

        <div className="px-5 py-6 space-y-6 pb-12">
          {/* Streak Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {streakDays}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  Day Civic Streak
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Keep it up!</p>
              </div>
            </div>

            {/* Progress to Next Badge */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  Progress to 30-Day Badge
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {daysUntilNextBadge} days to go
              </p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Your Badges
            </h2>
            <BadgeGrid badges={badges} />
          </div>

          {/* Activity History */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Activity History
            </h2>
            <ActivityFeed />
          </div>

          {/* My Reps Quick Access */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              My Representatives
            </h2>
            <div className="space-y-2">
              {reps.reps.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {rep.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{rep.title}</p>
                  </div>
                  <a
                    href={`mailto:${rep.email}`}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Email
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Settings
            </h2>
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    Push Notifications
                  </span>
                </div>
                <button className="w-11 h-6 bg-gray-900 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">Weekly Digest</span>
                </div>
                <button className="w-11 h-6 bg-gray-900 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">Riding Alerts</span>
                </div>
                <button className="w-11 h-6 bg-gray-900 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Demo Reset */}
          <button
            onClick={handleResetDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Reset Demo
          </button>

          <div className="text-center text-xs text-gray-400 pt-2">
            <p>CivicStream Demo v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
