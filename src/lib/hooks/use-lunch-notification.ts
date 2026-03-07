"use client";

import { useEffect, useRef } from "react";

type LunchSettings = {
  lunch_time: string;
  lunch_duration_minutes: number;
  notifications_enabled: boolean;
};

const REMINDER_MINUTES_BEFORE = 15;

export function useLunchNotification(settings: LunchSettings | null | undefined) {
  const notifiedToday = useRef(false);

  useEffect(() => {
    if (!settings?.notifications_enabled) return;

    const checkLunchTime = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const [hours, minutes] = settings.lunch_time.split(":").map(Number);
      const now = new Date();
      const lunchDate = new Date(now);
      lunchDate.setHours(hours, minutes, 0, 0);

      const diffMs = lunchDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Notify 15 minutes before lunch, once per day (reminder that lunch is coming up)
      if (
        diffMins >= 0 &&
        diffMins <= REMINDER_MINUTES_BEFORE &&
        !notifiedToday.current
      ) {
        notifiedToday.current = true;
        new Notification("PocketShift – Lunch Reminder", {
          body: `Lunch in ${diffMins} minutes! You have ${settings.lunch_duration_minutes} minutes for your break.`,
          icon: "/icons/icon-192.png",
        });
      }
    };

    const interval = setInterval(checkLunchTime, 60 * 1000);
    checkLunchTime();
    return () => clearInterval(interval);
  }, [settings?.lunch_time, settings?.lunch_duration_minutes, settings?.notifications_enabled]);

  // Reset daily
  useEffect(() => {
    const resetAtMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      const timeout = setTimeout(() => {
        notifiedToday.current = false;
        resetAtMidnight();
      }, msUntilMidnight);
      return () => clearTimeout(timeout);
    };
    return resetAtMidnight();
  }, []);
}
