export type ChecklistItem = { id: string; text: string; done: boolean };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          logo_url: string | null;
          currency: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          logo_url?: string | null;
          currency?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          logo_url?: string | null;
          currency?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          profile_id: string;
          start_date: string;
          duration_months: number | null;
          end_date: string | null;
          contract_type: string | null;
          notes: string | null;
          status: "draft" | "active" | "completed" | null;
          contact_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          start_date: string;
          duration_months?: number | null;
          end_date?: string | null;
          contract_type?: string | null;
          notes?: string | null;
          status?: "draft" | "active" | "completed" | null;
          contact_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          start_date?: string;
          duration_months?: number | null;
          end_date?: string | null;
          contract_type?: string | null;
          notes?: string | null;
          status?: "draft" | "active" | "completed" | null;
          contact_id?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          status: "todo" | "in_progress" | "done";
          recurrence_rule: string | null;
          recurrence_end: string | null;
          checklist: ChecklistItem[] | null;
          contact_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          status?: "todo" | "in_progress" | "done";
          recurrence_rule?: string | null;
          recurrence_end?: string | null;
          checklist?: ChecklistItem[] | null;
          contact_ids?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          status?: "todo" | "in_progress" | "done";
          recurrence_rule?: string | null;
          recurrence_end?: string | null;
          checklist?: ChecklistItem[] | null;
          contact_ids?: string[] | null;
          created_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          profile_id: string;
          first_name: string;
          last_name: string | null;
          department: string | null;
          role: string | null;
          gender: string | null;
          photo_url: string | null;
          met_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          first_name: string;
          last_name?: string | null;
          department?: string | null;
          role?: string | null;
          gender?: string | null;
          photo_url?: string | null;
          met_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          first_name?: string;
          last_name?: string | null;
          department?: string | null;
          role?: string | null;
          gender?: string | null;
          photo_url?: string | null;
          met_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          price: number;
          category: "vending" | "coffee" | "other";
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          price: number;
          category?: "vending" | "coffee" | "other";
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          price?: number;
          category?: "vending" | "coffee" | "other";
          is_default?: boolean;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          profile_id: string;
          menu_item_id: string | null;
          item_name: string;
          price: number;
          category: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          menu_item_id?: string | null;
          item_name: string;
          price: number;
          category: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          price?: number;
          category?: string;
          purchased_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          lunch_time: string;
          lunch_duration_minutes: number;
          notifications_enabled: boolean;
          lunch_reminders_enabled: boolean | null;
          contract_reminders_enabled: boolean | null;
          work_days: string | null;
          theme: string;
          currency: string;
          date_format: string | null;
          language: string | null;
          budget_weekly: number | null;
          budget_monthly: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lunch_time?: string;
          lunch_duration_minutes?: number;
          notifications_enabled?: boolean;
          lunch_reminders_enabled?: boolean | null;
          contract_reminders_enabled?: boolean | null;
          work_days?: string | null;
          theme?: string;
          currency?: string;
          date_format?: string | null;
          language?: string | null;
          budget_weekly?: number | null;
          budget_monthly?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lunch_time?: string;
          lunch_duration_minutes?: number;
          notifications_enabled?: boolean;
          lunch_reminders_enabled?: boolean | null;
          contract_reminders_enabled?: boolean | null;
          work_days?: string | null;
          theme?: string;
          currency?: string;
          date_format?: string | null;
          language?: string | null;
          budget_weekly?: number | null;
          budget_monthly?: number | null;
          created_at?: string;
        };
      };
    };
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type Contract = Database["public"]["Tables"]["contracts"]["Row"];
export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuItemInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type SettingsInsert = Database["public"]["Tables"]["settings"]["Insert"];

export type CalendarView = "day" | "week" | "month";

export type EventStatus = "todo" | "in_progress" | "done";

export type MenuCategory = "vending" | "coffee" | "other";

export const GENDERS = ["male", "female", "other"] as const;
export const ROLES = ["Manager", "Developer", "Designer", "Client", "HR", "Finance", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const CURRENCIES = ["EUR", "USD", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** App language: "device" = use device locale, or a locale code (en, it, de, etc.) */
export const LANGUAGES = [
  { value: "device", label: "Device" },
  { value: "en", label: "English" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
] as const;
export type AppLanguage = (typeof LANGUAGES)[number]["value"];

export const DATE_FORMATS = [
  { value: "locale" },
  { value: "short" },
  { value: "medium" },
  { value: "long" },
  { value: "iso" },
] as const;
export type DateFormatPreference = (typeof DATE_FORMATS)[number]["value"];

/** Returns locale-aware label for date format options (e.g. Italian: 31/12/24) */
export function getDateFormatLabel(value: string, locale?: string): string {
  const loc = locale ?? (typeof navigator !== "undefined" ? navigator.language : "en");
  const sample = new Date(2024, 11, 31);
  switch (value) {
    case "locale":
      return `Device default (${new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(sample)})`;
    case "short":
      return `Short (${new Intl.DateTimeFormat(loc, { dateStyle: "short" }).format(sample)})`;
    case "medium":
      return `Medium (${new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(sample)})`;
    case "long":
      return `Long (${new Intl.DateTimeFormat(loc, { dateStyle: "long" }).format(sample)})`;
    case "iso":
      return "ISO (2024-12-31)";
    default:
      return value;
  }
}
