import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettingsInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export async function upsertSettings(
  supabase: SupabaseClient,
  settings: SettingsInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("settings", "upsert", settings as Record<string, unknown>, async () => {
    const { error } = await supabase
      .from("settings")
      .upsert(settings as never, { onConflict: "user_id" });
    if (error) throw error;
  });
}
