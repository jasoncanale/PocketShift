"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/95 px-4 py-2.5 text-sm font-medium text-amber-950 backdrop-blur-sm dark:bg-amber-500/90 dark:text-amber-950 md:bottom-auto md:top-0"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>You&apos;re offline. Some features may be limited.</span>
    </div>
  );
}
