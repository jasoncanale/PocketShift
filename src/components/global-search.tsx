"use client";

import { useState, useMemo, useCallback } from "react";
import { useOpenSearchListener } from "@/lib/hooks/use-keyboard-shortcuts";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/providers/profile-provider";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useOpenSearchListener(useCallback(() => setOpen(true), []));
  const router = useRouter();
  const { activeProfile } = useProfile();
  const supabase = createClient();
  const profileId = activeProfile?.id;

  const { data: events = [] } = useQuery({
    queryKey: ["events", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase.from("events").select("id, title").eq("profile_id", profileId);
      return (data ?? []) as { id: string; title: string }[];
    },
    enabled: !!profileId && open,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase.from("contacts").select("id, first_name, last_name").eq("profile_id", profileId);
      return (data ?? []) as { id: string; first_name: string; last_name: string | null }[];
    },
    enabled: !!profileId && open,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase.from("contracts").select("id, contract_type, start_date").eq("profile_id", profileId);
      return (data ?? []) as { id: string; contract_type: string | null; start_date: string }[];
    },
    enabled: !!profileId && open,
  });

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return { events: [], contacts: [], contracts: [] };

    const eventMatches = events.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 5);
    const contactMatches = contacts
      .filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          (c.last_name?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 5);
    const contractMatches = contracts
      .filter((c) => (c.contract_type?.toLowerCase().includes(q) ?? false))
      .slice(0, 5);

    return { events: eventMatches, contacts: contactMatches, contracts: contractMatches };
  }, [q, events, contacts, contracts]);

  const hasResults =
    results.events.length > 0 ||
    results.contacts.length > 0 ||
    results.contracts.length > 0;

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipDesktop
        content={
          <>
            Search{" "}
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </>
        }
      >
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted md:w-64"
            aria-label="Search"
          >
            <Search className="size-4" />
            <span className="hidden md:inline">Search...</span>
          </button>
        </PopoverTrigger>
      </TooltipDesktop>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="border-b p-2">
          <Input
            placeholder="Search events, contacts, contracts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 border-0 focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {!q && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search...
            </p>
          )}
          {q && !hasResults && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found
            </p>
          )}
          {hasResults && (
            <div className="space-y-1">
              {results.events.length > 0 && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Events
                </div>
              )}
              {results.events.map((e) => (
                <button
                  key={e.id}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect("/events")}
                >
                  <span className="truncate">{e.title}</span>
                </button>
              ))}
              {results.contacts.length > 0 && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Contacts
                </div>
              )}
              {results.contacts.map((c) => (
                <button
                  key={c.id}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect("/contacts")}
                >
                  <span className="truncate">
                    {c.first_name} {c.last_name || ""}
                  </span>
                </button>
              ))}
              {results.contracts.length > 0 && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Contracts
                </div>
              )}
              {results.contracts.map((c) => (
                <button
                  key={c.id}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => handleSelect("/contracts")}
                >
                  <span className="truncate">{c.contract_type || "Contract"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
