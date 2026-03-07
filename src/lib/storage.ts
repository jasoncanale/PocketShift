import { createClient } from "@/lib/supabase/client";

const BUCKET = "avatars";

export async function uploadImage(
  file: File,
  path: string
): Promise<{ url: string } | { error: Error }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)
    ? ext
    : "png";
  const fullPath = `${path}-${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { error };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  return { url: publicUrl };
}

export async function deleteAvatar(url: string): Promise<{ error?: Error }> {
  try {
    const supabase = createClient();
    const path = url.split(`/storage/v1/object/public/${BUCKET}/`)[1];
    if (!path) return {};
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    return error ? { error } : {};
  } catch {
    return {};
  }
}

export const uploadAvatar = uploadImage;
