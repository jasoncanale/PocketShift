"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarViewComponent } from "@/components/calendar/calendar-view";
import { createClient } from "@/lib/supabase/client";
import * as eventsApi from "@/lib/api/events";
import * as contractsApi from "@/lib/api/contracts";
import * as contactsApi from "@/lib/api/contacts";
import { useProfile } from "@/providers/profile-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { Event, Contract, Contact } from "@/lib/types";
import { CalendarDays, Building2 } from "lucide-react";

export default function CalendarPage() {
  const { activeProfile } = useProfile();
  const supabase = createClient();
  const profileId = activeProfile?.id;

  const { data: events = [], isLoading: eventsLoading, isError: eventsError, error: eventsErrorObj, refetch: refetchEvents } = useQuery({
    queryKey: ["events", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return eventsApi.getEvents(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const { data: contracts = [], isLoading: contractsLoading, isError: contractsError, error: contractsErrorObj, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return contractsApi.getContracts(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const { data: contacts = [], isLoading: contactsLoading, isError: contactsError, error: contactsErrorObj, refetch: refetchContacts } = useQuery({
    queryKey: ["contacts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return contactsApi.getContacts(supabase, profileId);
    },
    enabled: !!profileId,
  });

  if (!activeProfile) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Create a company to get started"
        description="Select or create a company to view your calendar."
        action={
          <Button size="sm" asChild>
            <Link href="/companies">
              <Building2 className="mr-1 size-4" />
              Go to companies
            </Link>
          </Button>
        }
      />
    );
  }

  if (eventsError || contractsError || contactsError) {
    const err = eventsErrorObj ?? contractsErrorObj ?? contactsErrorObj;
    const refetch = () => {
      refetchEvents();
      refetchContracts();
      refetchContacts();
    };
    return (
      <QueryError
        error={err ?? null}
        refetch={refetch}
        message="Failed to load calendar data"
      />
    );
  }

  if (eventsLoading || contractsLoading || contactsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <CalendarViewComponent
      events={events}
      contracts={contracts}
      contacts={contacts}
    />
  );
}
