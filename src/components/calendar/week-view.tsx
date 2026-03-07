"use client";

import { cn, startOfWeek, addDays, isToday, isSameDay, getHours } from "@/lib/utils";
import { eventChipBg } from "@/lib/colors";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Event } from "@/lib/types";
import type { EventOccurrence } from "@/lib/recurrence";

type WeekViewProps = {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
  expandedOccurrences?: EventOccurrence[];
};

export function WeekView({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  expandedOccurrences = [],
}: WeekViewProps) {
  const { locale } = useDateFormat();
  const weekStart = startOfWeek(currentDate);
  const hours = getHours();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTimedEventsForDateAndHour = (date: Date, hourIndex: number) => {
    const dateStr = date.toISOString().split("T")[0];
    return expandedOccurrences
      .filter((o) => o.date === dateStr && o.event.due_time)
      .map((o) => o.event)
      .filter((e) => {
        const [h] = e.due_time!.split(":");
        return (parseInt(h, 10) || 0) === hourIndex;
      });
  };

  const getAllDayEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return expandedOccurrences
      .filter((o) => o.date === dateStr && !o.event.due_time)
      .map((o) => o.event);
  };

  return (
    <div className="select-none">
      {/* All-day row */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="py-2 text-[10px] text-muted-foreground text-right pr-2">All day</div>
        {days.map((day, i) => {
          const allDayEvts = getAllDayEventsForDate(day);
          return (
            <div
              key={i}
              className="min-h-[2rem] border-l p-1 space-y-0.5"
              onClick={() => onSelectDate(day)}
            >
              {allDayEvts.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px] leading-tight truncate",
                    event.status === "done"
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : event.status === "in_progress"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                  )}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="py-2" />
        {days.map((day, i) => {
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center py-1.5 text-xs transition-colors touch-manipulation",
                today && "text-primary font-bold",
                selected && "bg-primary/10 rounded-t-md"
              )}
            >
              <span className="text-muted-foreground">
                {day.toLocaleDateString(locale ?? undefined, { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex size-7 items-center justify-center rounded-full text-sm",
                  today && !selected && "bg-primary text-primary-foreground",
                  selected && "bg-primary text-primary-foreground"
                )}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[calc(100svh-16rem)]">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
          {hours.map((hour, hourIndex) => (
            <div key={hourIndex} className="contents">
              <div className="border-b py-3 pr-2 text-right text-[10px] text-muted-foreground">
                {hour}
              </div>
              {days.map((day, dayIndex) => {
                const dayEvents = getTimedEventsForDateAndHour(day, hourIndex);
                return (
                  <div
                    key={dayIndex}
                    className="relative border-b border-l min-h-[3rem]"
                    onClick={() => onSelectDate(day)}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute inset-x-0.5 top-0.5 rounded px-1 py-0.5 text-[10px] leading-tight truncate",
                          eventChipBg[event.status]
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
