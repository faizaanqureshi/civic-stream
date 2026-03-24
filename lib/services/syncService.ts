import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const persistCivicAction = async (
  userId: string,
  updates: any,
  activityLabel: string,
) => {
  // 1. Update the Profile (Points, IDs, etc.)
  const { error: profileError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  // 2. Insert the Activity Log
  const { error: activityError } = await supabase.from("activities").insert({
    user_id: userId,
    action: activityLabel,
  });

  if (profileError || activityError) {
    console.error("Sync Error:", profileError || activityError);
  }
};
