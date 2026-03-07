"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Download className="size-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">Install PocketShift</p>
          <p className="text-sm text-muted-foreground">
            Add to your home screen for quick access and a better experience.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
