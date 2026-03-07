import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contact, ContactInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export async function getContacts(
  supabase: SupabaseClient,
  profileId: string
): Promise<Contact[]> {
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return (data as Contact[]) || [];
}

export async function createContact(
  supabase: SupabaseClient,
  contact: ContactInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("contacts", "insert", contact as Record<string, unknown>, async () => {
    const { error } = await supabase.from("contacts").insert(contact as never);
    if (error) throw error;
  });
}

export async function updateContact(
  supabase: SupabaseClient,
  id: string,
  updates: {
    first_name: string;
    last_name: string | null;
    department: string | null;
    gender: string | null;
    photo_url: string | null;
    met_date: string | null;
    notes: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .update(updates as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteContact(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("contacts", "delete", { id }, async () => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) throw error;
  });
}
