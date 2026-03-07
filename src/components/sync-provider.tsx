"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { processPendingMutations } from "@/lib/offline-sync";
import { toast } from "sonner";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const handleSync = useCallback(async () => {
    const { synced, failed } = await processPendingMutations();
    if (synced > 0) {
      queryClient.invalidateQueries();
      toast.success(`Synced ${synced} change(s)`);
    }
    if (failed > 0) {
      toast.error(`${failed} change(s) failed to sync`);
    }
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onOnline = () => handleSync();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "BACKGROUND_SYNC") handleSync();
    };

    window.addEventListener("online", onOnline);
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [handleSync]);

  return <>{children}</>;
}
