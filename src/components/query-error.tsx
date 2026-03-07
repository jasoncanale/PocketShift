"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatError } from "@/lib/error-utils";

interface QueryErrorProps {
  error: Error | null;
  refetch?: () => void;
  /** Optional custom message */
  message?: string;
}

export function QueryError({ error, refetch, message }: QueryErrorProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <AlertCircle className="size-10 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{message ?? "Failed to load data"}</p>
        <p className="text-sm text-muted-foreground">{formatError(error)}</p>
      </div>
      {refetch && (
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      )}
    </div>
  );
}
