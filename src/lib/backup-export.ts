import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export type BackupData = {
  events: unknown[];
  contacts: unknown[];
  contracts: unknown[];
  profiles: unknown[];
  menu_items: unknown[];
  purchases: unknown[];
  settings: unknown | null;
  exported_at: string;
};

/**
 * Fetch all user data and export as JSON backup.
 * Fetches all profiles for the user, then all related data for those profiles.
 */
export async function fetchBackupData(userId: string): Promise<BackupData> {
  const supabase = createClient();

  const [profilesRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profiles = profilesRes.data ?? [];
  const profileIds = profiles.map((p) => p.id);

  if (profileIds.length === 0) {
    return {
      events: [],
      contacts: [],
      contracts: [],
      profiles: [],
      menu_items: [],
      purchases: [],
      settings: settingsRes.data ?? null,
      exported_at: new Date().toISOString(),
    };
  }

  const [eventsRes, contactsRes, contractsRes, menuRes, purchasesRes] = await Promise.all([
    supabase.from("events").select("*").in("profile_id", profileIds),
    supabase.from("contacts").select("*").in("profile_id", profileIds),
    supabase.from("contracts").select("*").in("profile_id", profileIds),
    supabase.from("menu_items").select("*").in("profile_id", profileIds),
    supabase.from("purchases").select("*").in("profile_id", profileIds),
  ]);

  return {
    events: eventsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    contracts: contractsRes.data ?? [],
    profiles,
    menu_items: menuRes.data ?? [],
    purchases: purchasesRes.data ?? [],
    settings: settingsRes.data ?? null,
    exported_at: new Date().toISOString(),
  };
}

/**
 * Trigger download of backup JSON file
 */
export function downloadBackup(data: BackupData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `pocketshift-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
