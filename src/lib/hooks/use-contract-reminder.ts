"use client";

import { useEffect, useRef } from "react";

type Contract = {
  id: string;
  end_date: string | null;
  contract_type: string | null;
};

const REMINDER_DAYS_BEFORE = 30;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

function checkContracts(contracts: Contract[], notified: Set<string>) {
  if (!contracts?.length || !("Notification" in window) || Notification.permission !== "granted")
    return;

  const now = new Date();
  for (const contract of contracts) {
    if (!contract.end_date) continue;

    const endDate = new Date(contract.end_date);
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd >= 0 && daysUntilEnd <= REMINDER_DAYS_BEFORE && !notified.has(contract.id)) {
      notified.add(contract.id);
      new Notification("PocketShift – Contract Reminder", {
        body: `${contract.contract_type || "Contract"} expires in ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"}.`,
        icon: "/icons/icon-192.png",
      });
    }
  }
}

export function useContractReminder(contracts: Contract[] | null | undefined) {
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!contracts?.length) return;

    checkContracts(contracts, notified.current);
    const interval = setInterval(
      () => checkContracts(contracts, notified.current),
      CHECK_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [contracts]);
}
