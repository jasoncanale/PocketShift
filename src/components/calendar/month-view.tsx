"use client";

import { cn, getWeekDays, getDaysInMonth, getFirstDayOfMonth, isToday, isSameDay } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import type { Event, Contract, Contact } from "@/lib/types";
import type { EventOccurrence } from "@/lib/recurrence";

type MonthViewProps = {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
  expandedOccurrences?: EventOccurrence[];
  contracts: Contract[];
  contacts: Contact[];
};

export function MonthView({
  currentDate,
  selectedDate,
  onSelectDate,
  events,
  expandedOccurrences = [],
  contracts,
  contacts,
}: MonthViewProps) {
  const { locale } = useDateFormat();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekDays = getWeekDays(locale);

  // Previous month padding
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const paddingDays = Array.from({ length: firstDay }, (_, i) => ({
    day: prevMonthDays - firstDay + 1 + i,
    isCurrentMonth: false,
    date: new Date(year, month - 1, prevMonthDays - firstDay + 1 + i),
  }));

  // Current month days
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: true,
    date: new Date(year, month, i + 1),
  }));

  // Next month padding
  const totalCells = paddingDays.length + currentDays.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextDays = Array.from({ length: remainingCells }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: false,
    date: new Date(year, month + 1, i + 1),
  }));

  const allDays = [...paddingDays, ...currentDays, ...nextDays];

  const getIndicators = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const indicators: { color: string; type: string }[] = [];

    // Events with due dates (including recurring)
    if (expandedOccurrences.some((o) => o.date === dateStr)) {
      indicators.push({ color: "bg-blue-500", type: "event" });
    }

    // Contract dates
    if (
      contracts.some(
        (c) => c.start_date === dateStr || c.end_date === dateStr
      )
    ) {
      indicators.push({ color: "bg-green-500", type: "contract" });
    }

    // Contact met dates
    if (contacts.some((c) => c.met_date === dateStr)) {
      indicators.push({ color: "bg-purple-500", type: "contact" });
    }

    return indicators;
  };

  return (
    <div className="select-none">
      <ScrollArea className="min-h-[200px] max-h-[min(calc(100svh-18rem),360px)]">
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-1 sticky top-0 bg-background z-10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
        {allDays.map((item, index) => {
          const indicators = getIndicators(item.date);
          const selected = isSameDay(item.date, selectedDate);
          const today = isToday(item.date);

          return (
            <button
              key={index}
              onClick={() => onSelectDate(item.date)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-1.5 text-sm transition-colors",
                "min-h-[44px] touch-manipulation",
                !item.isCurrentMonth && "text-muted-foreground/40",
                item.isCurrentMonth && "text-foreground",
                selected && "bg-primary text-primary-foreground rounded-md",
                today && !selected && "font-bold text-primary"
              )}
            >
              <span>{item.day}</span>
              {indicators.length > 0 && (
                <div className="flex gap-0.5">
                  {indicators.slice(0, 3).map((ind, i) => (
                    <div
                      key={i}
                      className={cn(
                        "size-1 rounded-full",
                        selected ? "bg-primary-foreground" : ind.color
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
        </div>
      </ScrollArea>
    </div>
  );
}
