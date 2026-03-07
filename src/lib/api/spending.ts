import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuItem, MenuItemInsert, Purchase, PurchaseInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export async function getMenuItems(
  supabase: SupabaseClient,
  profileId: string
): Promise<MenuItem[]> {
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("profile_id", profileId)
    .order("category")
    .order("name");
  return (data as MenuItem[]) || [];
}

export async function getPurchases(
  supabase: SupabaseClient,
  profileId: string,
  limit: number
): Promise<Purchase[]> {
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("profile_id", profileId)
    .order("purchased_at", { ascending: false })
    .limit(limit);
  return (data as Purchase[]) || [];
}

export async function insertMenuItems(
  supabase: SupabaseClient,
  items: MenuItemInsert[]
): Promise<void | { queued: true }> {
  if (items.length === 0) return;
  return withOfflineMutation("menu_items", "insert", { items } as Record<string, unknown>, async () => {
    const { error } = await supabase.from("menu_items").insert(items as never);
    if (error) throw error;
  });
}

export async function createMenuItem(
  supabase: SupabaseClient,
  item: MenuItemInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("menu_items", "insert", item as Record<string, unknown>, async () => {
    const { error } = await supabase.from("menu_items").insert(item as never);
    if (error) throw error;
  });
}

export async function updateMenuItem(
  supabase: SupabaseClient,
  id: string,
  updates: { name: string; price: number; category: "vending" | "coffee" | "other" }
): Promise<void | { queued: true }> {
  const payload = { id, ...updates };
  return withOfflineMutation("menu_items", "update", payload, async () => {
    const { error } = await supabase.from("menu_items").update(updates as never).eq("id", id);
    if (error) throw error;
  });
}

export async function deleteMenuItem(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("menu_items", "delete", { id }, async () => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;
  });
}

export async function createPurchase(
  supabase: SupabaseClient,
  purchase: PurchaseInsert
): Promise<void | { queued: true }> {
  return withOfflineMutation("purchases", "insert", purchase as Record<string, unknown>, async () => {
    const { error } = await supabase.from("purchases").insert(purchase as never);
    if (error) throw error;
  });
}

export async function updatePurchase(
  supabase: SupabaseClient,
  id: string,
  updates: {
    item_name: string;
    price: number;
    category: string;
    purchased_at: string;
  }
): Promise<void | { queued: true }> {
  const payload = { id, ...updates };
  return withOfflineMutation("purchases", "update", payload, async () => {
    const { error } = await supabase.from("purchases").update(updates as never).eq("id", id);
    if (error) throw error;
  });
}

export async function deletePurchase(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("purchases", "delete", { id }, async () => {
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) throw error;
  });
}
