import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileInsert, MenuItemInsert } from "@/lib/types";
import { withOfflineMutation } from "@/lib/offline-mutation";

export type MenuItemTemplate = {
  name: string;
  price: number;
  category: "vending" | "coffee" | "other";
  is_default: boolean;
};

export async function getProfiles(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  return (data as Profile[]) || [];
}

export async function createProfile(
  supabase: SupabaseClient,
  profile: ProfileInsert,
  menuTemplates: MenuItemTemplate[]
): Promise<Profile | { queued: true }> {
  const payload = { profile: profile as Record<string, unknown>, menu_templates: menuTemplates };
  return withOfflineMutation("profiles", "createProfile", payload, async () => {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile as never)
      .select()
      .single();
    if (error) throw error;
    const newProfile = data as Profile;
    if (menuTemplates.length > 0) {
      const menuItems = menuTemplates.map((t) => ({
        profile_id: newProfile.id,
        name: t.name,
        price: t.price,
        category: t.category,
        is_default: t.is_default,
      }));
      const { error: menuError } = await supabase
        .from("menu_items")
        .insert(menuItems as never);
      if (menuError) throw menuError;
    }
    return newProfile;
  });
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  updates: {
    company_name: string;
    logo_url?: string | null;
    currency?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(updates as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProfile(
  supabase: SupabaseClient,
  id: string
): Promise<void | { queued: true }> {
  return withOfflineMutation("profiles", "delete", { id }, async () => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
  });
}
