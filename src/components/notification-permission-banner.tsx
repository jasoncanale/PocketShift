"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { getOrCreateSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
const STORAGE_KEY = "notification-banner-dismissed";

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const supabase = createClient();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => (user ? getOrCreateSettings(supabase, user.id) : null),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const s = settings as { lunch_reminders_enabled?: boolean | null; contract_reminders_enabled?: boolean | null } | null;
  const remindersEnabled =
    (s?.lunch_reminders_enabled ?? true) || (s?.contract_reminders_enabled ?? true);

  const shouldShow =
    user &&
    remindersEnabled &&
    permission === "default" &&
    !dismissed;

  const handleRequest = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Bell className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm">
          Enable notifications to get lunch and contract reminders.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={handleRequest}>
          Enable
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
