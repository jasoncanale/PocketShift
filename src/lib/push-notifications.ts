/**
 * Push notification utilities.
 * Requires VAPID public key in NEXT_PUBLIC_VAPID_PUBLIC_KEY.
 * Backend (e.g. Supabase Edge Function) needed to send pushes using the private key.
 */

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set - push disabled");
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
    return subscription;
  } catch (e) {
    console.warn("Push subscription failed", e);
    return null;
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getPushSubscription();
  if (sub) {
    await sub.unsubscribe();
    return true;
  }
  return false;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function subscriptionToJson(sub: PushSubscription): Record<string, unknown> {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint,
    keys: json.keys,
    expirationTime: json.expirationTime,
  };
}
