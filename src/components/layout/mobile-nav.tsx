"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ClipboardList, Users, Coffee, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Events", href: "/events", icon: ClipboardList },
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Spending", href: "/spending", icon: Coffee },
  { title: "More", href: "/settings", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand/30 bg-background pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/calendar" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                isActive
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="size-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
