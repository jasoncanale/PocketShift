"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProfileSwitcher } from "@/components/profiles/profile-switcher";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/components/global-search";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-brand/30 px-4">
      <SidebarTrigger className="hidden md:flex" />
      <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
      <h1 className="flex items-center gap-2 text-lg font-bold md:hidden">
        <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="size-7" />
        PocketShift
      </h1>
      <div className="hidden flex-1 justify-center md:flex">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <TooltipDesktop content="Toggle theme">
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </TooltipDesktop>
        <div className="md:hidden">
          <ProfileSwitcher />
        </div>
      </div>
    </header>
  );
}
