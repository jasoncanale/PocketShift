/**
 * Consistent color coding across PocketShift:
 * - Red: errors, destructive, unsuccessful (expired, delete)
 * - Green: success, confirmation, done, active
 * - Yellow/Amber: warnings, pending (todo, upcoming)
 * - Blue: in progress, neutral info
 * - Other: creative but consistent for tags
 */

export const statusColors = {
  // Event status
  todo: "bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
  done: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",

  // Contract status
  active: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
  upcoming: "bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/30",
  expired: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30",

  // Spending categories
  vending: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
  coffee: "bg-amber-700/20 text-amber-900 dark:text-amber-300 border-amber-600/30",
  other: "bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30",

} as const;

/** Tag color palette for departments - varied colors */
const TAG_PALETTE = [
  "bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30",
  "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30",
  "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  "bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30",
] as const;

/** Returns a consistent color for a tag (e.g. department) based on its value */
export function getTagColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
}

export const cardBgColors = {
  success: "bg-green-500/10 border-green-500/30",
  warning: "bg-amber-500/10 border-amber-500/30",
  error: "bg-red-500/10 border-red-500/30",
  info: "bg-blue-500/10 border-blue-500/30",
  neutral: "bg-violet-500/10 border-violet-500/30",
} as const;

/** Event status → card/chip background (calendar views) */
export const eventCardBg: Record<"todo" | "in_progress" | "done", string> = {
  todo: "bg-amber-500/10",
  in_progress: "bg-blue-500/10",
  done: "bg-green-500/10",
};

/** Event status → compact chip (week/day grid) */
export const eventChipBg: Record<"todo" | "in_progress" | "done", string> = {
  todo: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  in_progress: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  done: "bg-green-500/20 text-green-700 dark:text-green-400",
};

/** Calendar entity type colors */
export const calendarEntityColors = {
  contract: "bg-green-500/10 border-green-500/30",
  contact: "bg-violet-500/10 border-violet-500/30",
} as const;

/** Chart colors for spending categories (hex for Recharts) */
export const categoryChartColors: Record<string, string> = {
  vending: "#64748b",   // slate-600
  coffee: "#b45309",    // amber-700
  other: "#7c3aed",    // violet-600
};
