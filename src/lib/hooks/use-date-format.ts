"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from "@/lib/utils";
import type { Settings } from "@/lib/types";

function getDeviceLocale(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.language;
}

/** Effective locale: app language from settings, or device when "device" */
function getEffectiveLocale(
  language: string | null | undefined,
  deviceLocale: string | undefined
): string | undefined {
  if (language && language !== "device") return language;
  return deviceLocale;
}

export function useDateFormat() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("settings")
        .select("date_format, language")
        .eq("user_id", user.id)
        .single();
      return data as Pick<Settings, "date_format" | "language"> | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const deviceLocale = getDeviceLocale();
  const locale = getEffectiveLocale(settings?.language, deviceLocale);
  const dateStyle = (settings?.date_format as "short" | "medium" | "long" | "locale" | "iso") ?? "locale";

  const formatDate = (date: Date | string) =>
    formatDateUtil(date, { locale, dateStyle });

  const formatDateTime = (date: Date | string) =>
    formatDateTimeUtil(date, { locale, dateStyle });

  return { formatDate, formatDateTime, locale, dateStyle };
}
