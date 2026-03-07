"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PwaUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registrationRef.current = reg;

        const showUpdate = () => setShowPrompt(true);

        if (reg.waiting) showUpdate();

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdate();
            }
          });
        });
      })
      .catch(() => {});

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        registrationRef.current
      ) {
        registrationRef.current.update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const handleRefresh = () => {
    const reg = registrationRef.current;
    if (!reg?.waiting) {
      window.location.reload();
      return;
    }
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    }, { once: true });
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <RefreshCw className="size-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">Update available</p>
          <p className="text-sm text-muted-foreground">
            A new version of PocketShift is ready. Refresh to get the latest.
          </p>
          <Button size="sm" className="mt-3" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
