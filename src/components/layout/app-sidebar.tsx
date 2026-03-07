"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Users,
  Coffee,
  Settings,
  ClipboardList,
  Building2,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ProfileSwitcher } from "@/components/profiles/profile-switcher";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Contracts", href: "/contracts", icon: FileText },
  { title: "Events", href: "/events", icon: ClipboardList },
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Spending", href: "/spending", icon: Coffee },
];

const secondaryItems = [
  { title: "Companies", href: "/companies", icon: Building2 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="size-8" />
          PocketShift
        </h1>
        <ProfileSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <TooltipDesktop content={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipDesktop>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <TooltipDesktop content={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipDesktop>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <TooltipDesktop content="Sign out">
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </TooltipDesktop>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
