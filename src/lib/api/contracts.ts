import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contract, ContractInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export async function getContracts(
  supabase: SupabaseClient,
  profileId: string
): Promise<Contract[]> {
  const { data } = await supabase
    .from("contracts")
    .select("*")
    .eq("profile_id", profileId)
    .order("start_date", { ascending: false });
  return (data as Contract[]) || [];
}

export async function createContract(
  supabase: SupabaseClient,
  contract: ContractInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("contracts", "insert", contract as Record<string, unknown>, async () => {
    const { error } = await supabase.from("contracts").insert(contract as never);
    if (error) throw error;
  });
}

export async function updateContract(
  supabase: SupabaseClient,
  id: string,
  updates: {
    start_date: string;
    duration_months: number | null;
    end_date: string | null;
    contract_type: string | null;
    notes: string | null;
    status?: "draft" | "active" | "completed" | null;
    contact_id?: string | null;
  }
): Promise<void | { queued: true }> {
  const payload = { id, ...updates };
  return withOfflineMutation("contracts", "update", payload, async () => {
    const { error } = await supabase.from("contracts").update(updates as never).eq("id", id);
    if (error) throw error;
  });
}

export async function deleteContract(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("contracts", "delete", { id }, async () => {
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) throw error;
  });
}
