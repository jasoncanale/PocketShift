import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings, SettingsInsert } from "./types";

const DEFAULT_SETTINGS: Omit<SettingsInsert, "user_id"> = {
  lunch_time: "12:30:00",
  lunch_duration_minutes: 60,
  notifications_enabled: true,
  lunch_reminders_enabled: true,
  contract_reminders_enabled: true,
  theme: "dark",
  currency: "EUR",
  date_format: "locale",
  language: "device",
};

export async function getOrCreateSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<Settings | null> {
  const { data: existing } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as Settings;

  const { data: inserted, error } = await supabase
    .from("settings")
    .insert({ user_id: userId, ...DEFAULT_SETTINGS })
    .select()
    .single();

  if (error) return null;
  return inserted as Settings;
}
