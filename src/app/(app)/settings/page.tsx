"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as settingsApi from "@/lib/api/settings";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, FileText, Building2, Loader2, Shield, Scale, Keyboard, Github, Info, Wallet, Download } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import Link from "next/link";
import { getOrCreateSettings } from "@/lib/settings";
import { fetchBackupData, downloadBackup } from "@/lib/backup-export";
import { settingsSchema } from "@/lib/validations";
import { formatError } from "@/lib/error-utils";
import { isOfflineQueued } from "@/lib/offline-mutation";
import { subscribeToPush } from "@/lib/push-notifications";
import type { Settings, SettingsInsert } from "@/lib/types";
import { CURRENCIES, DATE_FORMATS, getDateFormatLabel, LANGUAGES } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [lunchTime, setLunchTime] = useState("12:30");
  const [lunchDuration, setLunchDuration] = useState("60");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const WORK_DAY_LABELS: { value: number; label: string }[] = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };
  const [lunchRemindersEnabled, setLunchRemindersEnabled] = useState(true);
  const [contractRemindersEnabled, setContractRemindersEnabled] = useState(true);
  const [currency, setCurrency] = useState("EUR");
  const [budgetWeekly, setBudgetWeekly] = useState("");
  const [budgetMonthly, setBudgetMonthly] = useState("");
  const [language, setLanguage] = useState("device");
  const [dateFormat, setDateFormat] = useState("locale");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [themeMounted, setThemeMounted] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return getOrCreateSettings(supabase, user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings) {
      const lt = settings.lunch_time ?? "12:30";
      setLunchTime(lt.includes(":") ? lt.slice(0, 5) : "12:30");
      setLunchDuration(String(settings.lunch_duration_minutes ?? 60));
      setLunchRemindersEnabled(
        (settings as { lunch_reminders_enabled?: boolean | null }).lunch_reminders_enabled ?? true
      );
      const wd = (settings as { work_days?: string | null }).work_days ?? "1,2,3,4,5";
      const parsed = wd.split(",").map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6);
      setWorkDays(parsed.length > 0 ? parsed : [1, 2, 3, 4, 5]);
      setContractRemindersEnabled(
        (settings as { contract_reminders_enabled?: boolean | null }).contract_reminders_enabled ?? true
      );
      setCurrency(settings.currency || "EUR");
      const bw = (settings as { budget_weekly?: number | null }).budget_weekly;
      const bm = (settings as { budget_monthly?: number | null }).budget_monthly;
      setBudgetWeekly(bw != null && bw > 0 ? String(bw) : "");
      setBudgetMonthly(bm != null && bm > 0 ? String(bm) : "");
      setLanguage((settings as { language?: string })?.language ?? "device");
      setDateFormat((settings as { date_format?: string })?.date_format ?? "locale");
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === "granted") {
      const sub = await subscribeToPush();
      if (sub) {
        toast.success("Notifications and push enabled");
      } else {
        toast.success("Notifications enabled");
      }
    } else if (result === "denied") {
      toast.error("Notification permission denied");
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const lunchDurationNum = parseInt(lunchDuration, 10) || 60;
      const lunchTimeFormatted = lunchTime.length === 5 ? `${lunchTime}:00` : lunchTime;

      const parsed = settingsSchema.safeParse({
        lunch_time: lunchTimeFormatted,
        lunch_duration_minutes: lunchDurationNum,
        notifications_enabled: lunchRemindersEnabled,
        theme: theme || "dark",
        currency: currency || "EUR",
        date_format: dateFormat || "locale",
        language: language || "device",
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings");
      }

      const settingsData: SettingsInsert = {
        user_id: user.id,
        lunch_time: lunchTimeFormatted,
        lunch_duration_minutes: lunchDurationNum,
        notifications_enabled: lunchRemindersEnabled,
        lunch_reminders_enabled: lunchRemindersEnabled,
        contract_reminders_enabled: contractRemindersEnabled,
        theme: theme || "dark",
        currency: currency || "EUR",
        language: language || "device",
        date_format: dateFormat || "locale",
      };

      return settingsApi.upsertSettings(supabase, settingsData);
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(formatError(err));
    },
  });

  const handleLogout = async () => {
    setSignOutDialogOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Quick links (mobile "More" menu items) */}
      <div className="space-y-2 md:hidden">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/contracts">
            <FileText className="mr-2 size-4" />
            Contracts
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/companies">
            <Building2 className="mr-2 size-4" />
            Companies
          </Link>
        </Button>
        <Separator />
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose your theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="darkMode">Dark mode</Label>
            {themeMounted ? (
              <Switch
                id="darkMode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            ) : (
              <div className="h-5 w-9 rounded-full border bg-muted" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Day</CardTitle>
          <CardDescription>Set your work days and lunch time. Lunch reminders only fire on selected days.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Work days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WORK_DAY_LABELS.map(({ value, label }) => (
                <Badge
                  key={value}
                  variant={workDays.includes(value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-2.5 py-1 text-xs font-medium transition-colors",
                    workDays.includes(value)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleWorkDay(value)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lunchTime">Lunch Time</Label>
              <Input
                id="lunchTime"
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lunchDuration">Duration (min)</Label>
              <Input
                id="lunchDuration"
                type="number"
                min="15"
                max="120"
                value={lunchDuration}
                onChange={(e) => setLunchDuration(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Choose which reminders to receive. Enable browser notifications to receive alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lunchReminders">Lunch reminders</Label>
            <Switch
              id="lunchReminders"
              checked={lunchRemindersEnabled}
              onCheckedChange={setLunchRemindersEnabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Reminder 15 minutes before your lunch break
          </p>
          <div className="flex items-center justify-between">
            <Label htmlFor="contractReminders">Contract reminders</Label>
            <Switch
              id="contractReminders"
              checked={contractRemindersEnabled}
              onCheckedChange={setContractRemindersEnabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Reminder 30 days before a contract expires
          </p>
          {(lunchRemindersEnabled || contractRemindersEnabled) && notificationPermission !== "granted" && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={requestNotificationPermission}
            >
              {notificationPermission === "default"
                ? "Allow notifications"
                : notificationPermission === "denied"
                  ? "Notifications blocked – enable in browser settings"
                  : "Enable notifications"}
            </Button>
          )}
          {notificationPermission === "granted" && (lunchRemindersEnabled || contractRemindersEnabled) && (
            <p className="text-xs text-muted-foreground">Notifications enabled</p>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4" />
            Budget
          </CardTitle>
          <CardDescription>Optional weekly and monthly spending limits. Alerts shown on Spending page when exceeded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="budgetWeekly">Weekly limit ({currency})</Label>
            <Input
              id="budgetWeekly"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 50"
              value={budgetWeekly}
              onChange={(e) => setBudgetWeekly(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="budgetMonthly">Monthly limit ({currency})</Label>
            <Input
              id="budgetMonthly"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 200"
              value={budgetMonthly}
              onChange={(e) => setBudgetMonthly(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency</CardTitle>
          <CardDescription>Default currency for spending (company can override)</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* App language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
          <CardDescription>App language for dates and formatting (overrides device language)</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Date format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date format</CardTitle>
          <CardDescription>How dates are displayed (uses app language above)</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {getDateFormatLabel(f.value, language === "device" ? undefined : language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="size-4" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>Quick actions you can trigger from the keyboard</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted-foreground">Open search</dt>
              <dd>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
                <span className="mx-2 text-muted-foreground">or</span>
                <Kbd>/</Kbd>
              </dd>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-muted-foreground">Add new item</dt>
                <dd>
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>N</Kbd>
                  </KbdGroup>
                </dd>
              </div>
              <p className="text-xs text-muted-foreground mt-1">On Events, People, Contracts, Companies, Spending</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-muted-foreground">Close dialog</dt>
              <dd>
                <Kbd>Esc</Kbd>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Socials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Socials</CardTitle>
          <CardDescription>Website and source code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/80"
              asChild
            >
              <Link href="https://pocket-shift-xi.vercel.app" target="_blank" rel="noopener noreferrer">
                <Image src="/icons/icon-192.png" alt="" width={16} height={16} className="size-4" />
                Website
              </Link>
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/80"
              asChild
            >
              <Link href="https://github.com/jasoncanale/PocketShift" target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                GitHub
              </Link>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal</CardTitle>
          <CardDescription>Privacy policy and terms of service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/privacy">
              <Shield className="mr-2 size-4" />
              Privacy Policy
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/terms">
              <Scale className="mr-2 size-4" />
              Terms and Conditions
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="size-4" />
            Data Backup
          </CardTitle>
          <CardDescription>
            Export all your data (events, people, contracts, companies, menu, purchases, settings) as a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportBackup}
            disabled={backupLoading || !user}
          >
            {backupLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Export all data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Version */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="size-4" />
            Version
          </CardTitle>
          <CardDescription>
            App version. Bumped for logic changes, section moves, renames, logo or icon updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm font-medium">{APP_VERSION}</p>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>

      <Separator />

      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleLogout}>
              Sign out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="destructive" onClick={() => setSignOutDialogOpen(true)} className="w-full">
        <LogOut className="mr-2 size-4" />
        Sign Out
      </Button>
    </div>
  );
}
