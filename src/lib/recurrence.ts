import type { Event } from "@/lib/types";

export type RecurrenceRule = "daily" | "weekly" | "monthly" | null;

export interface EventOccurrence {
  event: Event;
  date: string; // YYYY-MM-DD
}

/**
 * Expands a recurring event into occurrences within the given date range.
 */
export function expandRecurringEvents(
  events: Event[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const result: EventOccurrence[] = [];
  const startStr = rangeStart.toISOString().split("T")[0];
  const endStr = rangeEnd.toISOString().split("T")[0];

  for (const event of events) {
    if (!event.due_date) {
      continue;
    }

    const rule = (event.recurrence_rule as RecurrenceRule) || null;
    const recurrenceEnd = event.recurrence_end
      ? new Date(event.recurrence_end + "T23:59:59")
      : null;

    if (!rule) {
      if (event.due_date >= startStr && event.due_date <= endStr) {
        result.push({ event, date: event.due_date });
      }
      continue;
    }

    let current = new Date(event.due_date);
    const end = recurrenceEnd && recurrenceEnd < rangeEnd ? recurrenceEnd : rangeEnd;

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      if (dateStr >= startStr && dateStr <= endStr) {
        result.push({ event, date: dateStr });
      }

      switch (rule) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current = new Date(end.getTime() + 1);
      }
    }
  }

  return result;
}
