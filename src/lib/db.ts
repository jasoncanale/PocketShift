import Dexie, { type Table } from "dexie";

export interface CachedEvent {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  status: "todo" | "in_progress" | "done";
  recurrence_rule: string | null;
  recurrence_end: string | null;
  checklist: { id: string; text: string; done: boolean }[] | null;
  created_at: string;
  synced_at?: number;
}

export interface CachedContact {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string | null;
  department: string | null;
  gender: string | null;
  photo_url: string | null;
  met_date: string | null;
  notes: string | null;
  created_at: string;
  synced_at?: number;
}

export interface CachedContract {
  id: string;
  profile_id: string;
  start_date: string;
  duration_months: number | null;
  end_date: string | null;
  contract_type: string | null;
  notes: string | null;
  created_at: string;
  synced_at?: number;
}

export interface CachedProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  currency: string | null;
  is_active: boolean;
  created_at: string;
  synced_at?: number;
}

export interface CachedMenuItem {
  id: string;
  profile_id: string;
  name: string;
  price: number;
  category: string;
  is_default: boolean;
  created_at: string;
  synced_at?: number;
}

export interface CachedPurchase {
  id: string;
  profile_id: string;
  menu_item_id: string | null;
  item_name: string;
  price: number;
  category: string;
  purchased_at: string;
  created_at: string;
  synced_at?: number;
}

export interface PendingMutation {
  id?: number;
  tag: string;
  table: string;
  operation: "insert" | "update" | "delete" | "upsert" | "createProfile";
  payload: string;
  created_at: number;
}

export class PocketShiftDB extends Dexie {
  events!: Table<CachedEvent, string>;
  contacts!: Table<CachedContact, string>;
  contracts!: Table<CachedContract, string>;
  profiles!: Table<CachedProfile, string>;
  menu_items!: Table<CachedMenuItem, string>;
  purchases!: Table<CachedPurchase, string>;
  pending_mutations!: Table<PendingMutation, number>;

  constructor() {
    super("PocketShiftDB");
    this.version(1).stores({
      events: "id, profile_id, synced_at",
      contacts: "id, profile_id, synced_at",
      contracts: "id, profile_id, synced_at",
      profiles: "id, user_id, synced_at",
      menu_items: "id, profile_id, synced_at",
      purchases: "id, profile_id, synced_at",
      pending_mutations: "++id, tag, table, created_at",
    });
  }
}

export const db = new PocketShiftDB();
