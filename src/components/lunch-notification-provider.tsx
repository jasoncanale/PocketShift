"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { getOrCreateSettings } from "@/lib/settings";
import { useLunchNotification } from "@/lib/hooks/use-lunch-notification";

export function LunchNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const full = await getOrCreateSettings(supabase, user.id);
      return full
        ? {
            lunch_time: full.lunch_time,
            lunch_duration_minutes: full.lunch_duration_minutes,
            notifications_enabled:
              full.lunch_reminders_enabled ?? full.notifications_enabled ?? true,
          }
        : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useLunchNotification(settings ?? null);

  return <>{children}</>;
}
