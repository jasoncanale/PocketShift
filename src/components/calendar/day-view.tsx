"use client";

import { cn, getHours } from "@/lib/utils";
import { eventCardBg, eventChipBg, calendarEntityColors } from "@/lib/colors";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Event, Contract, Contact } from "@/lib/types";

type DayViewProps = {
  selectedDate: Date;
  events: Event[];
  contracts: Contract[];
  contacts: Contact[];
};

export function DayView({
  selectedDate,
  events,
  contracts,
  contacts,
}: DayViewProps) {
  const { formatDate, locale } = useDateFormat();
  const hours = getHours();
  const dateStr = selectedDate.toISOString().split("T")[0];

  const dayEventsAll = events.filter((e) => e.due_date === dateStr);
  const allDayEvents = dayEventsAll.filter((e) => !e.due_time);
  const timedEvents = dayEventsAll.filter((e) => e.due_time);
  const getHourIndex = (timeStr: string) => {
    const [h] = timeStr.split(":");
    return parseInt(h, 10) || 0;
  };
  const dayContracts = contracts.filter(
    (c) => c.start_date === dateStr || c.end_date === dateStr
  );
  const dayContacts = contacts.filter((c) => c.met_date === dateStr);

  const hasItems = dayEventsAll.length > 0 || dayContracts.length > 0 || dayContacts.length > 0;

  return (
    <div className="select-none">
      {/* Date header */}
      <div className="mb-3 text-center">
        <h3 className="text-lg font-semibold">{formatDate(selectedDate)}</h3>
        <p className="text-sm text-muted-foreground">
          {selectedDate.toLocaleDateString(locale ?? undefined, { weekday: "long" })}
        </p>
      </div>

      {/* Day items summary */}
      {hasItems && (
        <div className="mb-4 space-y-2">
          {dayContracts.map((contract) => (
            <div
              key={contract.id}
              className={cn("rounded-lg border p-3", calendarEntityColors.contract)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                  Contract
                </Badge>
                <span className="text-sm">
                  {contract.start_date === dateStr ? "Starts" : "Ends"}
                  {contract.contract_type && ` - ${contract.contract_type}`}
                </span>
              </div>
            </div>
          ))}

          {allDayEvents.map((event) => (
            <div
              key={event.id}
              className={cn("rounded-lg border p-3", eventCardBg[event.status])}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{event.title}</span>
                <Badge variant="outline" className={cn("text-xs", eventChipBg[event.status])}>
                  {event.status.replace("_", " ")}
                </Badge>
              </div>
              {event.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
          ))}

          {dayContacts.map((contact) => (
            <div
              key={contact.id}
              className={cn("rounded-lg border p-3", calendarEntityColors.contact)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">
                  Met
                </Badge>
                <span className="text-sm">
                  {contact.first_name} {contact.last_name || ""}
                  {contact.department && ` (${contact.department})`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hourly timeline */}
      <ScrollArea className="h-[calc(100svh-22rem)]">
        <div className="space-y-0">
          {hours.map((hour, index) => {
            const slotEvents = timedEvents.filter((e) => getHourIndex(e.due_time!) === index);
            return (
              <div
                key={index}
                className="flex min-h-[3rem] border-b"
              >
                <div className="w-16 shrink-0 py-2 pr-2 text-right text-xs text-muted-foreground">
                  {hour}
                </div>
                <div className="flex-1 border-l pl-2 space-y-1 py-1">
                  {slotEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn("rounded px-2 py-1 text-xs", eventChipBg[event.status])}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
