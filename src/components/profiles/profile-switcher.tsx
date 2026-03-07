"use client";

import { useProfile } from "@/providers/profile-provider";
import { CompanyLogo } from "@/components/profiles/company-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfile } = useProfile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          {activeProfile ? (
            <>
              <CompanyLogo
                src={activeProfile.logo_url}
                fallback={activeProfile.company_name}
                size="sm"
              />
              <span className="truncate text-sm">
                {activeProfile.company_name}
              </span>
            </>
          ) : (
            <>
              <Building2 className="size-4" />
              <span className="text-sm text-muted-foreground">
                No company
              </span>
            </>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Companies</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => setActiveProfile(profile)}
            className="gap-2"
          >
            <CompanyLogo
              src={profile.logo_url}
              fallback={profile.company_name}
              size="xs"
            />
            <span className="truncate">{profile.company_name}</span>
            {activeProfile?.id === profile.id && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/companies" className="gap-2">
            <Plus className="size-4" />
            Manage companies
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
