import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/shared/config/supabase";

export function useAccount() {
  const [user, setUser] = useState<User | null | undefined>(() =>
    supabase ? undefined : null,
  );
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return user;
}
