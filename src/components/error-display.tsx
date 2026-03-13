"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Min height for layout (e.g. min-h-svh, min-h-[50vh]) */
  minHeight?: string;
}

export function ErrorDisplay({ error, reset, minHeight = "min-h-svh" }: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error?.message || "An unexpected error occurred.";
  const copyable = `${message}${error?.digest ? `\nDigest: ${error.digest}` : ""}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-6 p-6 ${minHeight}`}>
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-10 text-destructive" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={user ? "/calendar" : "/"}>Go home</Link>
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="size-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Copy error
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
