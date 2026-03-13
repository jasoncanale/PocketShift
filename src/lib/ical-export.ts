import { format } from "date-fns";
import type { Event, Contract } from "@/lib/types";

/**
 * Format a date for iCalendar (YYYYMMDD)
 */
function icalDate(d: Date): string {
  return format(d, "yyyyMMdd");
}

/**
 * Format a datetime for iCalendar (YYYYMMDDTHHmmssZ) in UTC
 */
function icalDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

/**
 * Escape special characters in iCal text (commas, semicolons, backslashes)
 */
function escapeIcalText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Generate iCalendar (.ics) content from events and optionally contracts
 */
export function generateIcalContent(
  events: Event[],
  contracts: Contract[] = [],
  options?: { includeContracts?: boolean }
): string {
  const includeContracts = options?.includeContracts ?? true;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PocketShift//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const uid = event.id ? `event-${event.id}@pocketshift` : `event-${Date.now()}-${Math.random().toString(36).slice(2)}@pocketshift`;
    const dtstamp = icalDateTime(new Date().toISOString());
    const summary = escapeIcalText(event.title);
    const description = event.description ? escapeIcalText(event.description) : "";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);

    if (event.due_date) {
      if (event.due_time) {
        const dt = `${event.due_date}T${event.due_time}`;
        lines.push(`DTSTART:${icalDateTime(dt)}`);
        // Default 1 hour duration if no end
        const endDate = new Date(dt);
        endDate.setHours(endDate.getHours() + 1);
        lines.push(`DTEND:${icalDateTime(endDate.toISOString())}`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${icalDate(new Date(event.due_date))}`);
        lines.push(`DTEND;VALUE=DATE:${icalDate(new Date(event.due_date))}`);
      }
    }

    lines.push("END:VEVENT");
  }

  if (includeContracts) {
    for (const contract of contracts) {
      if (!contract.start_date) continue;
      const uid = `contract-${contract.id}@pocketshift`;
      const dtstamp = icalDateTime(new Date().toISOString());
      const summary = escapeIcalText(contract.contract_type || "Contract");

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`SUMMARY:${summary}`);
      if (contract.notes) lines.push(`DESCRIPTION:${escapeIcalText(contract.notes)}`);
      lines.push(`DTSTART;VALUE=DATE:${icalDate(new Date(contract.start_date))}`);

      if (contract.end_date) {
        const end = new Date(contract.end_date);
        end.setDate(end.getDate() + 1); // exclusive end in iCal
        lines.push(`DTEND;VALUE=DATE:${icalDate(end)}`);
      } else {
        const start = new Date(contract.start_date);
        start.setDate(start.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${icalDate(start)}`);
      }

      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger download of .ics file
 */
export function downloadIcal(events: Event[], contracts: Contract[] = [], filename?: string): void {
  const content = generateIcalContent(events, contracts);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `pocketshift-calendar-${format(new Date(), "yyyy-MM-dd")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
