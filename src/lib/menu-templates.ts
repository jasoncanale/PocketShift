import type { MenuCategory } from "@/lib/types";

export const DEFAULT_MENU_TEMPLATES: {
  name: string;
  price: number;
  category: MenuCategory;
}[] = [
  { name: "Coffee", price: 2.5, category: "coffee" },
  { name: "Espresso", price: 1.8, category: "coffee" },
  { name: "Cappuccino", price: 3.2, category: "coffee" },
  { name: "Water", price: 1.5, category: "vending" },
  { name: "Chips", price: 1.0, category: "vending" },
  { name: "Soda", price: 1.8, category: "vending" },
  { name: "Candy bar", price: 1.2, category: "vending" },
  { name: "Sandwich", price: 4.5, category: "other" },
];
