import { useCivicStream } from "@/context/CivicStreamContext";
import { createClient } from "../supabase/client";

export function useCivicActions() {
  const { state, dispatch } = useCivicStream();
  const supabase = createClient();

  const trackBillRead = async (billId: string, title: string) => {
    if (state.readBillIds.includes(billId)) return;

    // Local Update
    dispatch({ type: "MARK_BILL_READ", payload: billId });

    // DB Update
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          points: (state.points || 0) + 10,
          read_bill_ids: [...state.readBillIds, billId],
        })
        .eq("id", user.id);

      await supabase.from("activities").insert({
        user_id: user.id,
        action: `Earned 10pts: Read bill ${title}`,
      });
    }
  };

  return { trackBillRead };
}
