import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Contact
export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  department: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  met_date: z.string().optional(),
  notes: z.string().optional(),
});

// Profile
export const profileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  currency: z.string().optional().nullable(),
});

// Event
export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  recurrence_rule: z
    .union([z.enum(["daily", "weekly", "monthly"]), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  recurrence_end: z.string().optional().nullable(),
});

// Contract
export const contractSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  duration_months: z.string().optional(),
  contract_type: z.string().optional(),
  notes: z.string().optional(),
});

// Menu item
export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Invalid price"),
  category: z.enum(["vending", "coffee", "other"]),
});

// Purchase
export const purchaseSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Invalid price"),
  category: z.enum(["vending", "coffee", "other"]),
  purchased_at: z.string().optional(),
});

// Settings
export const settingsSchema = z.object({
  lunch_time: z.string().min(1, "Lunch time is required"),
  lunch_duration_minutes: z.coerce.number().min(1).max(120),
  notifications_enabled: z.boolean(),
  theme: z.string(),
  currency: z.string(),
  date_format: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
