import { queueMutation } from "./offline-sync";

export type OfflineQueued = { queued: true };

export function isOfflineQueued(
  data: unknown
): data is OfflineQueued {
  return typeof data === "object" && data !== null && "queued" in data && (data as OfflineQueued).queued === true;
}

function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError && (e.message === "Failed to fetch" || e.message.includes("network")))
    return true;
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch");
  }
  return false;
}

/**
 * Wraps an API mutation. When offline or on network error, queues the mutation
 * and returns { queued: true } so the caller can show "Saved offline" instead of throwing.
 */
export async function withOfflineMutation<T>(
  table: string,
  operation: "insert" | "update" | "delete" | "upsert" | "createProfile",
  payload: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T | OfflineQueued> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueMutation(table, operation, payload);
    return { queued: true };
  }
  try {
    return await fn();
  } catch (e) {
    if (isNetworkError(e)) {
      await queueMutation(table, operation, payload);
      return { queued: true };
    }
    throw e;
  }
}
