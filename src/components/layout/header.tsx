"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProfileSwitcher } from "@/components/profiles/profile-switcher";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/components/global-search";
import { Button } from "@/components/ui/button";

export function Header() {
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
        <div className="md:hidden">
          <ProfileSwitcher />
        </div>
      </div>
    </header>
  );
}
