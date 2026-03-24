import { useEffect, useState, useMemo } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "../supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // useMemo ensures we aren't "re-grabbing" the client on every render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      if (mounted) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, currentSession: Session | null) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, session, loading };
}
