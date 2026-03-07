"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { get, set, del } from "idb-keyval";

const PERSIST_KEY = "pocketshift-query-cache";

function createPersister(): Persister {
  return {
    persistClient: async (client) => {
      await set(PERSIST_KEY, client);
    },
    restoreClient: async () => {
      return (await get(PERSIST_KEY)) ?? undefined;
    },
    removeClient: async () => {
      await del(PERSIST_KEY);
    },
  };
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  const [persister] = useState(() => (typeof window !== "undefined" ? createPersister() : undefined));

  if (typeof window === "undefined" || !persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        buster: "v1",
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
