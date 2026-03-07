import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export async function getEvents(
  supabase: SupabaseClient,
  profileId: string
): Promise<Event[]> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return (data as Event[]) || [];
}

export async function createEvent(
  supabase: SupabaseClient,
  event: EventInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("events", "insert", event as Record<string, unknown>, async () => {
    const { error } = await supabase.from("events").insert(event as never);
    if (error) throw error;
  });
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  updates: {
    title: string;
    description: string | null;
    due_date: string | null;
    due_time: string | null;
    status: "todo" | "in_progress" | "done";
    recurrence_rule?: string | null;
    recurrence_end?: string | null;
    checklist?: { id: string; text: string; done: boolean }[] | null;
  }
): Promise<void | { queued: true }> {
  const payload = { id, ...updates };
  return withOfflineMutation("events", "update", payload, async () => {
    const { error } = await supabase.from("events").update(updates as never).eq("id", id);
    if (error) throw error;
  });
}

export async function updateEventStatus(
  supabase: SupabaseClient,
  id: string,
  status: "todo" | "in_progress" | "done"
): Promise<void | { queued: true }> {
  return withOfflineMutation("events", "update", { id, status }, async () => {
    const { error } = await supabase.from("events").update({ status } as never).eq("id", id);
    if (error) throw error;
  });
}

export async function deleteEvent(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("events", "delete", { id }, async () => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
  });
}
