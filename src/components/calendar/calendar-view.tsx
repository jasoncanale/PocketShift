"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { addMonths, addDays, startOfWeek, cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { eventCardBg, eventChipBg, calendarEntityColors } from "@/lib/colors";
import type { CalendarView, Event, Contract, Contact } from "@/lib/types";
import { expandRecurringEvents } from "@/lib/recurrence";

type CalendarViewProps = {
  events: Event[];
  contracts: Contract[];
  contacts: Contact[];
};

export function CalendarViewComponent({
  events,
  contracts,
  contacts,
}: CalendarViewProps) {
  const { locale } = useDateFormat();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const navigateBack = useCallback(() => {
    setCurrentDate((prev) => {
      if (view === "month") return addMonths(prev, -1);
      if (view === "week") return addDays(prev, -7);
      return addDays(prev, -1);
    });
  }, [view]);

  const navigateForward = useCallback(() => {
    setCurrentDate((prev) => {
      if (view === "month") return addMonths(prev, 1);
      if (view === "week") return addDays(prev, 7);
      return addDays(prev, 1);
    });
  }, [view]);

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const loc = locale ?? undefined;
  const dateStr = selectedDate.toISOString().split("T")[0];

  const rangeStart =
    view === "month"
      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      : view === "week"
        ? startOfWeek(currentDate)
        : currentDate;
  const rangeEnd =
    view === "month"
      ? addMonths(rangeStart, 1)
      : view === "week"
        ? addDays(rangeStart, 6)
        : addDays(rangeStart, 1);
  const expanded = expandRecurringEvents(events, rangeStart, rangeEnd);
  const dayEvents = expanded.filter((o) => o.date === dateStr).map((o) => o.event);
  const dayContracts = contracts.filter(
    (c) => c.start_date === dateStr || c.end_date === dateStr
  );
  const dayContacts = contacts.filter((c) => c.met_date === dateStr);
  const hasDayItems = dayEvents.length > 0 || dayContracts.length > 0 || dayContacts.length > 0;

  const getTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString(loc, {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) {
        return `${ws.toLocaleDateString(loc, { month: "short", day: "numeric" })} - ${we.getDate()}, ${we.getFullYear()}`;
      }
      return `${ws.toLocaleDateString(loc, { month: "short", day: "numeric" })} - ${we.toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(loc, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={navigateBack} className="size-8" aria-label="Previous period">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={navigateForward} className="size-8" aria-label="Next period">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
          <TabsList className="h-8">
            <TabsTrigger value="day" className="text-xs px-2">Day</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2">Week</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-2">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Title */}
      <h2 className="text-center text-sm font-medium">{getTitle()}</h2>

      {/* Views */}
      {view === "month" && (
        <>
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            events={events}
            expandedOccurrences={expanded}
            contracts={contracts}
            contacts={contacts}
          />
          {/* Selected day summary */}
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">
              {selectedDate.toLocaleDateString(loc, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            {hasDayItems ? (
              <div className="space-y-2">
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
                {dayEvents.map((event) => (
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
                    {event.due_time && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.due_time.slice(0, 5)}
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
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled for this day</p>
            )}
          </div>
        </>
      )}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          events={events}
          expandedOccurrences={expanded}
        />
      )}
      {view === "day" && (
        <DayView
          selectedDate={selectedDate}
          events={dayEvents}
          contracts={contracts}
          contacts={contacts}
        />
      )}
    </div>
  );
}
