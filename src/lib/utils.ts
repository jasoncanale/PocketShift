import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "EUR",
  locale?: string
): string {
  return new Intl.NumberFormat(locale ?? (typeof navigator !== "undefined" ? navigator.language : "en"), {
    style: "currency",
    currency,
  }).format(amount);
}

export type DateFormatOptions = {
  /** Locale (e.g. navigator.language). undefined = device default */
  locale?: string;
  /** "short" | "medium" | "long" | "locale" | "iso". "locale" = medium with device locale */
  dateStyle?: "short" | "medium" | "long" | "locale" | "iso";
};

/**
 * Format a date. Use useDateFormat() in components for user preference.
 * Standalone: uses device locale + medium style.
 */
export function formatDate(
  date: Date | string,
  options?: DateFormatOptions
): string {
  const d = new Date(date);
  const locale = options?.locale ?? (typeof navigator !== "undefined" ? navigator.language : undefined);
  const style = options?.dateStyle ?? "medium";

  if (style === "iso") {
    return d.toISOString().slice(0, 10);
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: style === "locale" ? "medium" : style,
  }).format(d);
}

/**
 * Format date and time. Use useDateFormat() for user preference.
 */
export function formatDateTime(
  date: Date | string,
  options?: DateFormatOptions & { timeStyle?: "short" | "medium" | "long" }
): string {
  const d = new Date(date);
  const locale = options?.locale ?? (typeof navigator !== "undefined" ? navigator.language : undefined);
  const dateStyle = options?.dateStyle ?? "medium";
  const timeStyle = options?.timeStyle ?? "short";

  if (dateStyle === "iso") {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: dateStyle === "locale" ? "medium" : dateStyle,
    timeStyle,
  }).format(d);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getWeekDays(locale?: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i); // Sun=7, Mon=8, ...
    return new Intl.DateTimeFormat(locale ?? (typeof navigator !== "undefined" ? navigator.language : "en"), {
      weekday: "short",
    }).format(d);
  });
}

export function getHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12;
    const ampm = i < 12 ? "AM" : "PM";
    return `${h}:00 ${ampm}`;
  });
}
