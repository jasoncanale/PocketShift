"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  Users,
  FileText,
  Coffee,
  Building2,
  WifiOff,
} from "lucide-react";

/**
 * True only when the app is running as an installed PWA (launched from home screen icon).
 * Use standalone only – fullscreen/minimal-ui can match in Samsung Internet and other
 * mobile browsers even when not installed as PWA, causing unwanted redirects.
 */
function isPwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (isPwa() && !loading) {
      router.replace(user ? "/calendar" : "/login");
    }
  }, [router, user, loading]);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-brand/40 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="size-9" />
            <span className="text-xl font-bold">PocketShift</span>
          </div>
          <div className="flex gap-2">
            {user ? (
              <Button asChild>
                <Link href="/calendar">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl space-y-16">
          <section className="text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Personal work productivity <span className="text-brand">tracker</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Manage events, contacts, contracts, and spending across multiple companies. Works offline.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {user ? (
                <Button size="lg" asChild>
                  <Link href="/calendar">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">Create account</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-8 text-center text-2xl font-semibold">Features</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-brand/30 p-4">
                <CalendarDays className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">Calendar</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daily, weekly, and monthly views. See events, contracts, and people in one place.
                </p>
              </div>
              <div className="rounded-lg border border-brand/30 p-4">
                <ClipboardList className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">Events & Projects</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track tasks with due dates, status, and optional recurrence.
                </p>
              </div>
              <div className="rounded-lg border border-brand/30 p-4">
                <Users className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">People</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep track of people you meet: name, department, photo, and meeting date.
                </p>
              </div>
              <div className="rounded-lg border border-brand/30 p-4">
                <FileText className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">Contracts</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor contract start, duration, and expiry with reminders.
                </p>
              </div>
              <div className="rounded-lg border border-brand/30 p-4">
                <Coffee className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">Spending</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log vending and coffee purchases. View statistics and export data.
                </p>
              </div>
              <div className="rounded-lg border border-brand/30 p-4">
                <Building2 className="mb-2 size-8 text-brand" aria-hidden />
                <h3 className="font-medium">Companies</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Switch between company profiles. Each has its own data and settings.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-brand/40 bg-muted/50 p-6 text-center">
            <WifiOff className="mx-auto mb-2 size-8 text-brand" aria-hidden />
            <h3 className="font-medium">Works offline</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              PocketShift is a Progressive Web App. Install it on your device for quick access. Data syncs when you&apos;re back online.
            </p>
          </section>

          <section className="text-center">
            <Button size="lg" asChild>
              <Link href={user ? "/calendar" : "/register"}>
                {user ? "Go to Dashboard" : "Get started free"}
              </Link>
            </Button>
          </section>
        </div>
      </main>

      <footer className="border-t border-brand/40 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>PocketShift</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
