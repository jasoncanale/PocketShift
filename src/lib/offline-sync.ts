import { db } from "./db";
import { createClient } from "./supabase/client";
import * as companiesApi from "./api/companies";

const SYNC_TAG = "pocketshift-sync";

interface SyncManager {
  register(tag: string): Promise<void>;
}

export async function registerBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sync = (reg as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
    if (sync) await sync.register(SYNC_TAG);
  } catch (e) {
    console.warn("Background sync registration failed", e);
  }
}

export async function queueMutation(
  table: string,
  operation: "insert" | "update" | "delete" | "upsert" | "createProfile",
  payload: Record<string, unknown>
): Promise<void> {
  await db.pending_mutations.add({
    tag: SYNC_TAG,
    table,
    operation,
    payload: JSON.stringify(payload),
    created_at: Date.now(),
  });
  await registerBackgroundSync();
}

export async function processPendingMutations(): Promise<{ synced: number; failed: number }> {
  const supabase = createClient();
  const pending = await db.pending_mutations.orderBy("created_at").toArray();
  let synced = 0;
  let failed = 0;

  for (const mut of pending) {
    try {
      const payload = JSON.parse(mut.payload) as Record<string, unknown>;
      const table = supabase.from(mut.table as "events" | "contacts" | "contracts" | "profiles" | "menu_items" | "purchases" | "settings");

      if (mut.operation === "insert") {
        const toInsert = payload.items ? (payload.items as never[]) : (payload as never);
        const { error } = await table.insert(toInsert);
        if (error) throw error;
      } else if (mut.operation === "update") {
        const id = payload.id as string;
        const { id: _, ...updates } = payload;
        const { error } = await table.update(updates as never).eq("id", id);
        if (error) throw error;
      } else if (mut.operation === "delete") {
        const { error } = await table.delete().eq("id", payload.id as string);
        if (error) throw error;
      } else if (mut.operation === "upsert") {
        const { error } = await table.upsert(payload as never, { onConflict: "user_id" });
        if (error) throw error;
      } else if (mut.operation === "createProfile") {
        const { profile, menu_templates } = payload as {
          profile: Record<string, unknown>;
          menu_templates: Array<{ name: string; price: number; category: "vending" | "coffee" | "other"; is_default: boolean }>;
        };
        await companiesApi.createProfile(supabase, profile as never, menu_templates as never);
      }
      await db.pending_mutations.delete(mut.id!);
      synced++;
    } catch (e) {
      console.warn("Sync failed for mutation", mut.id, e);
      failed++;
    }
  }
  return { synced, failed };
}
