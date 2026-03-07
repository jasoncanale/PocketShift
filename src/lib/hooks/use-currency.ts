"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/providers/profile-provider";
import type { Settings } from "@/lib/types";

export function useCurrency(): string {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const supabase = createClient();

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("settings")
        .select("currency")
        .eq("user_id", user.id)
        .single();
      return data as Pick<Settings, "currency"> | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Profile override > user settings > EUR default
  return (
    activeProfile?.currency ??
    settings?.currency ??
    "EUR"
  );
}
