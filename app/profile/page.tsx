"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Mail,
  LogOut,
  User,
  MapPin,
  ChevronRight,
  Trophy,
  FileText,
  Map,
} from "lucide-react";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ActivityFeed } from "@/components/gamification/ActivityFeed";
import { useCivicStream } from "@/context/CivicStreamContext";
import { useStreak } from "@/lib/hooks/useStreak";
import { useDemoData } from "@/lib/hooks/useDemoData";
import { useRiding } from "@/lib/hooks/useRiding";
import { createClient } from "@/lib/supabase/client";
import { getBadgesForUser } from "@/lib/utils/getBadgesForUser";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { state, dispatch } = useCivicStream();
  const { streakDays, daysUntilNextBadge, progressPercent } = useStreak();
  const { reps } = useDemoData();
  const badges = getBadgesForUser(state.earnedBadgeIds);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile and recent 5 activities
      const [profileRes, activityRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (profileRes.data) {
        dispatch({
          type: "SYNC_FROM_SUPABASE",
          payload: {
            ...profileRes.data,
            activities: activityRes.data?.map((a: any) => ({
              id: a.id,
              action: a.action,
              time: a.created_at,
            })),
          },
        });
      }
    };

    fetchUserData();
  }, []);

  const { data: repsData } = useRiding(state.postalCode);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await supabase.auth.signOut();
      dispatch({ type: "RESET_DEMO" });
      router.push("/onboarding");
    }
  };

  const handleChangePostalCode = () => {
    dispatch({ type: "RESET_DEMO" });
    router.push("/onboarding?edit=true");
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  // Calculate current level based on points
  const points = state.points || 0;
  let currentLevel = 1;
  if (points >= 500) currentLevel = 4;
  else if (points >= 250) currentLevel = 3;
  else if (points >= 100) currentLevel = 2;

  // Safely get counts (in case older users have missing arrays in localStorage)
  const billsReadCount = state.readBillIds?.length || 0;
  const zoningViewCount = state.zoningClickIds?.length || 0;

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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {points} Points
                  </span>
                  <p className="text-xs text-gray-500">Keep it up!</p>
                </div>
              </div>
            </div>

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

          {/* Civic Impact Stats */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Civic Impact
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {/* Level Stat */}
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {currentLevel}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">
                  Level
                </p>
              </div>

              {/* Bills Stat */}
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {billsReadCount}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">
                  Bills Read
                </p>
              </div>

              {/* Zoning Stat */}
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <Map className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {zoningViewCount}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">
                  Zoning
                </p>
              </div>
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
            <ActivityFeed activities={state.activities || []} />
          </div>

          {/* My Reps Quick Access */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              My Representatives
            </h2>
            <div className="space-y-2">
              {(repsData?.reps ?? []).slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                  {rep.photo ? (
                    <img
                      src={rep.photo}
                      alt={rep.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {rep.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{rep.title}</p>
                  </div>
                  {rep.email && (
                    <a
                      href={`mailto:${rep.email}`}
                      className="px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0">
                      Email
                    </a>
                  )}
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

          {/* Location */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Your Location
            </h2>
            <button
              onClick={handleChangePostalCode}
              className="w-full bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#0F9B7A]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">
                    {state.postalCode}
                  </p>
                  <p className="text-xs text-gray-500">{state.riding}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#0F9B7A] text-xs font-bold">
                Change
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Demo Reset */}
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all border border-gray-200">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>

            <div className="text-center text-[10px] text-gray-400 mt-6 uppercase tracking-widest">
              <p>CivicStream v1.0.4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
