"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/providers/profile-provider";
import { useContractReminder } from "@/lib/hooks/use-contract-reminder";
import { getOrCreateSettings } from "@/lib/settings";

export function ContractReminderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const supabase = createClient();

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => (user ? getOrCreateSettings(supabase, user.id) : null),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", activeProfile?.id],
    queryFn: async () => {
      if (!activeProfile?.id) return [];
      const { data } = await supabase
        .from("contracts")
        .select("id, end_date, contract_type")
        .eq("profile_id", activeProfile.id)
        .not("end_date", "is", null);
      return (data ?? []) as { id: string; end_date: string | null; contract_type: string | null }[];
    },
    enabled: !!activeProfile?.id,
  });

  const contractRemindersEnabled =
    settings?.contract_reminders_enabled ?? true;

  useContractReminder(
    contractRemindersEnabled ? contracts : []
  );

  return <>{children}</>;
}
