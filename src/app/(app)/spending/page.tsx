"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as spendingApi from "@/lib/api/spending";
import { useProfile } from "@/providers/profile-provider";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Plus, Coffee, ShoppingCart, Trash2, BarChart3, PenLine, Copy, Pencil, Loader2, Download, Trash, FileUp, Search } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { statusColors } from "@/lib/colors";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { DEFAULT_MENU_TEMPLATES } from "@/lib/menu-templates";
import type { MenuItem, MenuItemInsert, Purchase, PurchaseInsert, MenuCategory } from "@/lib/types";
import { menuItemSchema, purchaseSchema } from "@/lib/validations";
import { formatError } from "@/lib/error-utils";
import { isOfflineQueued } from "@/lib/offline-mutation";
import { downloadCsv, parseCsvRow } from "@/lib/csv-export";
import { format } from "date-fns";
import { getOrCreateSettings } from "@/lib/settings";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export default function SpendingPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const currency = useCurrency();
  const { formatDateTime, locale } = useDateFormat();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [editPurchaseOpen, setEditPurchaseOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    item_name: "",
    price: "",
    category: "other" as MenuCategory,
    purchased_at: "",
  });
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "vending" as MenuCategory,
  });
  const [customForm, setCustomForm] = useState({
    item_name: "",
    price: "",
    category: "other" as MenuCategory,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "menu" | "purchase"; id: string } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseLimit, setPurchaseLimit] = useState(50);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const importPurchaseInputRef = useRef<HTMLInputElement>(null);

  const profileId = activeProfile?.id;

  useKeyboardShortcuts({ onAdd: () => setMenuOpen(true) });

  const { data: menuItems = [], isError: menuItemsError, error: menuItemsErrorObj, refetch: refetchMenuItems } = useQuery({
    queryKey: ["menu_items", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return spendingApi.getMenuItems(supabase, profileId);
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return getOrCreateSettings(supabase, user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: purchases = [], isLoading: purchasesLoading, isError: purchasesError, error: purchasesErrorObj, refetch: refetchPurchases } = useQuery({
    queryKey: ["purchases", profileId, purchaseLimit],
    queryFn: async () => {
      if (!profileId) return [];
      return spendingApi.getPurchases(supabase, profileId, purchaseLimit);
    },
    enabled: !!profileId,
  });

  const addMenuMutation = useMutation({
    mutationFn: async (item: MenuItemInsert) => spendingApi.createMenuItem(supabase, item),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      setMenuOpen(false);
      setMenuForm({ name: "", price: "", category: "vending" });
      toast.success("Menu item added");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const updateMenuMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      price,
      category,
    }: {
      id: string;
      name: string;
      price: number;
      category: MenuCategory;
    }) => {
      return spendingApi.updateMenuItem(supabase, id, { name, price, category });
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      setEditMenuOpen(false);
      setEditingMenuItem(null);
      setMenuForm({ name: "", price: "", category: "vending" });
      toast.success("Menu item updated");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => spendingApi.deleteMenuItem(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      toast.success("Menu item deleted");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const addFromTemplatesMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) return;
      const items = DEFAULT_MENU_TEMPLATES.map((t) => ({
        profile_id: profileId,
        name: t.name,
        price: t.price,
        category: t.category,
        is_default: false,
      }));
      return spendingApi.insertMenuItems(supabase, items);
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      toast.success("Templates added to menu");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (purchase: PurchaseInsert) => spendingApi.createPurchase(supabase, purchase),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase logged");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: async ({
      id,
      item_name,
      price,
      category,
      purchased_at,
    }: {
      id: string;
      item_name: string;
      price: number;
      category: string;
      purchased_at: string;
    }) => {
      return spendingApi.updatePurchase(supabase, id, {
        item_name,
        price,
        category,
        purchased_at,
      });
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setEditPurchaseOpen(false);
      setEditingPurchase(null);
      toast.success("Purchase updated");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: string) => spendingApi.deletePurchase(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      setEditPurchaseOpen(false);
      setEditingPurchase(null);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      toast.success("Purchase deleted");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const togglePurchaseSelect = (id: string) => {
    setSelectedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPurchases = () => {
    if (selectedPurchaseIds.size === filteredPurchases.length) {
      setSelectedPurchaseIds(new Set());
    } else {
      setSelectedPurchaseIds(new Set(filteredPurchases.map((p) => p.id)));
    }
  };

  const handleImportPurchases = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;
    e.target.value = "";
    setImportInProgress(true);
    let success = 0;
    let queued = 0;
    let errors = 0;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0]?.toLowerCase();
      const hasHeader = header?.includes("item") || header?.includes("name");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        if (!line.trim()) continue;
        const cols = parseCsvRow(line);
        const item_name = cols[0] ?? "Imported";
        const priceStr = cols[1] ?? "0";
        const category = (cols[2] ?? "other") as "vending" | "coffee" | "other";
        const dateStr = cols[3] ?? null;

        const parsed = purchaseSchema.safeParse({
          item_name: item_name.trim() || "Imported",
          price: priceStr,
          category: ["vending", "coffee", "other"].includes(category) ? category : "other",
        });

        if (parsed.success && parsed.data) {
          try {
            let purchased_at: string | undefined;
            if (dateStr) {
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                purchased_at = d.toISOString();
              }
            }
            const res = await spendingApi.createPurchase(supabase, {
              profile_id: profileId,
              menu_item_id: null,
              item_name: parsed.data.item_name,
              price: parseFloat(parsed.data.price),
              category: parsed.data.category,
              ...(purchased_at && { purchased_at }),
            });
            if (isOfflineQueued(res)) queued++;
            else success++;
          } catch {
            errors++;
          }
        } else {
          errors++;
        }
      }

      if (queued === 0) queryClient.invalidateQueries({ queryKey: ["purchases"] });
      const parts = [];
      if (success > 0) parts.push(`Imported ${success}`);
      if (queued > 0) parts.push(`${queued} saved offline`);
      if (errors > 0) parts.push(`${errors} failed`);
      toast.success(parts.length ? parts.join(", ") : "No purchases imported");
    } finally {
      setImportInProgress(false);
    }
  };

  const handleBulkDeletePurchases = async (ids: string[]) => {
    setBulkDeleteInProgress(true);
    try {
      let queued = 0;
      for (const id of ids) {
        const res = await spendingApi.deletePurchase(supabase, id);
        if (isOfflineQueued(res)) queued++;
      }
      setSelectedPurchaseIds(new Set());
      setBulkDeleteOpen(false);
      if (queued > 0) {
        toast.success(queued === ids.length ? "Saved offline, will sync when back online" : `${queued} saved offline, rest deleted`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["purchases"] });
        toast.success(`${ids.length} purchase(s) deleted`);
      }
    } finally {
      setBulkDeleteInProgress(false);
    }
  };

  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    addMenuMutation.mutate({
      profile_id: profileId,
      name: menuForm.name,
      price: parseFloat(menuForm.price),
      category: menuForm.category,
    });
  };

  const handleEditMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    const parsed = menuItemSchema.safeParse(menuForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    const price = parseFloat(menuForm.price);
    updateMenuMutation.mutate({
      id: editingMenuItem.id,
      name: menuForm.name,
      price,
      category: menuForm.category,
    });
  };

  const openEditMenu = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
    });
    setEditMenuOpen(true);
  };

  const openAddMenu = () => {
    setEditingMenuItem(null);
    setMenuForm({ name: "", price: "", category: "vending" });
    setMenuOpen(true);
  };

  const handleQuickPurchase = (item: MenuItem) => {
    if (!profileId) return;
    purchaseMutation.mutate({
      profile_id: profileId,
      menu_item_id: item.id,
      item_name: item.name,
      price: item.price,
      category: item.category,
    });
  };

  const handleCustomPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    const parsed = purchaseSchema.safeParse({
      ...customForm,
      item_name: customForm.item_name.trim() || "Custom",
      purchased_at: undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    const price = parseFloat(customForm.price);
    purchaseMutation.mutate(
      {
        profile_id: profileId,
        menu_item_id: null,
        item_name: customForm.item_name.trim() || "Custom",
        price,
        category: customForm.category,
      },
      {
        onSuccess: () => {
          setCustomOpen(false);
          setCustomForm({ item_name: "", price: "", category: "other" });
        },
      }
    );
  };

  const openEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    const d = new Date(purchase.purchased_at);
    const pad = (n: number) => String(n).padStart(2, "0");
    const purchasedAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setPurchaseForm({
      item_name: purchase.item_name,
      price: String(purchase.price),
      category: purchase.category as MenuCategory,
      purchased_at: purchasedAt,
    });
    setEditPurchaseOpen(true);
  };

  const handleEditPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    const parsed = purchaseSchema.safeParse(purchaseForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    const price = parseFloat(purchaseForm.price);
    const purchasedAt = purchaseForm.purchased_at
      ? new Date(purchaseForm.purchased_at).toISOString()
      : editingPurchase.purchased_at;
    updatePurchaseMutation.mutate({
      id: editingPurchase.id,
      item_name: purchaseForm.item_name.trim() || "Item",
      price,
      category: purchaseForm.category,
      purchased_at: purchasedAt,
    });
  };

  const purchaseSearchQ = purchaseSearch.trim().toLowerCase();
  const filteredPurchases = purchases.filter((p) => {
    const d = new Date(p.purchased_at);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (purchaseSearchQ && !p.item_name.toLowerCase().includes(purchaseSearchQ)) return false;
    return true;
  });

  const todayTotal = purchases
    .filter((p) => new Date(p.purchased_at).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + Number(p.price), 0);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekTotal = purchases
    .filter((p) => {
      const d = new Date(p.purchased_at);
      return d >= weekStart && d <= weekEnd;
    })
    .reduce((sum, p) => sum + Number(p.price), 0);
  const monthTotal = purchases
    .filter((p) => {
      const d = new Date(p.purchased_at);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, p) => sum + Number(p.price), 0);

  const budgetWeekly = (settings as { budget_weekly?: number | null })?.budget_weekly ?? null;
  const budgetMonthly = (settings as { budget_monthly?: number | null })?.budget_monthly ?? null;
  const weeklyExceeded = budgetWeekly != null && budgetWeekly > 0 && weekTotal > budgetWeekly;
  const monthlyExceeded = budgetMonthly != null && budgetMonthly > 0 && monthTotal > budgetMonthly;

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Select a profile first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Spending</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/spending/statistics">
              <BarChart3 className="mr-1 size-4" />
              Stats
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomOpen(true)}
          >
            <PenLine className="mr-1 size-4" />
            Custom
          </Button>
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <TooltipDesktop content={<>Add menu item <KbdGroup><Kbd>Ctrl</Kbd><Kbd>N</Kbd></KbdGroup></>}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAddMenu}>
                <Plus className="mr-1 size-4" />
                Item
              </Button>
            </DialogTrigger>
            </TooltipDesktop>
            <DialogContent>
              <form onSubmit={handleAddMenu}>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                  <DialogDescription>Add an item from the vending or coffee machine</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div>
                    <Label htmlFor="item_name">Item Name</Label>
                    <Input
                      id="item_name"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={menuForm.category}
                      onValueChange={(v) =>
                        setMenuForm((f) => ({ ...f, category: v as MenuCategory }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vending">Vending</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMenuMutation.isPending}>
                    {addMenuMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Adding...
                      </>
                    ) : (
                      "Add Item"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget exceeded alerts */}
      {(weeklyExceeded || monthlyExceeded) && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              {weeklyExceeded && monthlyExceeded
                ? "Weekly and monthly budget exceeded"
                : weeklyExceeded
                  ? "Weekly budget exceeded"
                  : "Monthly budget exceeded"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weeklyExceeded && monthlyExceeded
                ? `${formatCurrency(weekTotal, currency, locale)} / ${formatCurrency(budgetWeekly!, currency, locale)} this week; ${formatCurrency(monthTotal, currency, locale)} / ${formatCurrency(budgetMonthly!, currency, locale)} this month`
                : weeklyExceeded
                  ? `${formatCurrency(weekTotal, currency, locale)} / ${formatCurrency(budgetWeekly!, currency, locale)} this week`
                  : `${formatCurrency(monthTotal, currency, locale)} / ${formatCurrency(budgetMonthly!, currency, locale)} this month`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Today's total and budget progress */}
      <div className="space-y-2">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Today&apos;s spending</span>
            <span className="text-lg font-bold">{formatCurrency(todayTotal, currency, locale)}</span>
          </CardContent>
        </Card>
        {(budgetWeekly != null && budgetWeekly > 0) || (budgetMonthly != null && budgetMonthly > 0) ? (
          <div className="flex flex-wrap gap-2">
            {budgetWeekly != null && budgetWeekly > 0 && (
              <Card className="flex-1 min-w-[140px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">This week</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(weekTotal, currency, locale)} / {formatCurrency(budgetWeekly, currency, locale)}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        weekTotal > budgetWeekly ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, (weekTotal / budgetWeekly) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            {budgetMonthly != null && budgetMonthly > 0 && (
              <Card className="flex-1 min-w-[140px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">This month</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(monthTotal, currency, locale)} / {formatCurrency(budgetMonthly, currency, locale)}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        monthTotal > budgetMonthly ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, (monthTotal / budgetMonthly) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="buy">
        <TabsList className="w-full">
          <TabsTrigger value="buy" className="flex-1">Quick Buy</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          <TabsTrigger value="menu" className="flex-1">Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-3 mt-3">
          <Dialog open={customOpen} onOpenChange={setCustomOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <PenLine className="mr-2 size-4" />
                Log custom purchase (not in menu)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCustomPurchase}>
                <DialogHeader>
                  <DialogTitle>Log Custom Purchase</DialogTitle>
                  <DialogDescription>
                    Add a purchase not in your menu (e.g. snack, drink)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div>
                    <Label htmlFor="custom_item">Item Name</Label>
                    <Input
                      id="custom_item"
                      value={customForm.item_name}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, item_name: e.target.value }))
                      }
                      placeholder="e.g. Chips, Soda"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_price">Price</Label>
                    <Input
                      id="custom_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customForm.price}
                      onChange={(e) =>
                        setCustomForm((f) => ({ ...f, price: e.target.value }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={customForm.category}
                      onValueChange={(v) =>
                        setCustomForm((f) => ({ ...f, category: v as MenuCategory }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vending">Vending</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={purchaseMutation.isPending}>
                    {purchaseMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Logging...
                      </>
                    ) : (
                      "Log Purchase"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {menuItemsError ? (
            <QueryError
              error={menuItemsErrorObj ?? null}
              refetch={refetchMenuItems}
              message="Failed to load menu"
            />
          ) : menuItems.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="No menu items"
              description="Add menu items to quick-buy, or use the button above for custom purchases."
              action={
                <Button size="sm" onClick={openAddMenu}>
                  <Plus className="mr-1 size-4" />
                  Add item
                </Button>
              }
            />
          ) : (
            <>
              {(["coffee", "vending", "other"] as MenuCategory[]).map((cat) => {
                const items = menuItems.filter((i) => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="mb-2 text-sm font-medium capitalize flex items-center gap-1.5">
                      {cat === "coffee" ? (
                        <Coffee className="size-3.5" />
                      ) : (
                        <ShoppingCart className="size-3.5" />
                      )}
                      {cat}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="h-auto flex-col gap-0.5 py-3"
                          onClick={() => handleQuickPurchase(item)}
                          disabled={purchaseMutation.isPending}
                        >
                          <span className="text-sm">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.price, currency, locale)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
              placeholder="To"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="vending">Vending</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              ref={importPurchaseInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportPurchases}
            />
            <TooltipDesktop content="Import purchases from CSV">
              <Button
                variant="outline"
                size="sm"
                onClick={() => importPurchaseInputRef.current?.click()}
                disabled={importInProgress || !profileId}
              >
                {importInProgress ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <FileUp className="mr-1 size-4" />
                )}
                Import
              </Button>
            </TooltipDesktop>
            <TooltipDesktop content="Export purchases to CSV">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                const headers = ["Item", "Price", "Category", "Date"];
                const rows = filteredPurchases.map((p) => [
                  p.item_name,
                  Number(p.price),
                  p.category,
                  format(new Date(p.purchased_at), "yyyy-MM-dd HH:mm"),
                ]);
                downloadCsv(headers, rows, `purchases-${format(new Date(), "yyyy-MM-dd")}.csv`);
                toast.success("Purchases exported");
              }}
              disabled={filteredPurchases.length === 0}
            >
              <Download className="mr-1 size-4" />
              Export
            </Button>
            </TooltipDesktop>
          </div>
          <Dialog open={editPurchaseOpen} onOpenChange={(o) => { setEditPurchaseOpen(o); if (!o) setEditingPurchase(null); }}>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleEditPurchase}>
                <DialogHeader>
                  <DialogTitle>Edit Purchase</DialogTitle>
                  <DialogDescription>
                    Update item name, price, category, or date
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div>
                    <Label htmlFor="edit_purchase_item">Item Name</Label>
                    <Input
                      id="edit_purchase_item"
                      value={purchaseForm.item_name}
                      onChange={(e) =>
                        setPurchaseForm((f) => ({ ...f, item_name: e.target.value }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_purchase_price">Price</Label>
                    <Input
                      id="edit_purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseForm.price}
                      onChange={(e) =>
                        setPurchaseForm((f) => ({ ...f, price: e.target.value }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={purchaseForm.category}
                      onValueChange={(v) =>
                        setPurchaseForm((f) => ({ ...f, category: v as MenuCategory }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vending">Vending</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_purchase_date">Date & Time</Label>
                    <Input
                      id="edit_purchase_date"
                      type="datetime-local"
                      value={purchaseForm.purchased_at}
                      onChange={(e) =>
                        setPurchaseForm((f) => ({ ...f, purchased_at: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (editingPurchase) {
                        setDeleteTarget({ type: "purchase", id: editingPurchase.id });
                        setDeleteConfirmOpen(true);
                      }
                    }}
                    disabled={deletePurchaseMutation.isPending}
                  >
                    Delete
                  </Button>
                  <Button type="submit" disabled={updatePurchaseMutation.isPending}>
                    {updatePurchaseMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {purchasesError ? (
            <QueryError
              error={purchasesErrorObj ?? null}
              refetch={refetchPurchases}
              message="Failed to load purchases"
            />
          ) : purchasesLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            purchases.length === 0 ? (
              <EmptyState
                icon={Coffee}
                title="No purchases yet"
                description="Log a purchase from the Menu tab or add a custom purchase above."
                action={
                  <Button size="sm" onClick={() => setCustomOpen(true)}>
                    <PenLine className="mr-1 size-4" />
                    Log custom purchase
                  </Button>
                }
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No purchases match filters
                </CardContent>
              </Card>
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-purchases"
                  checked={selectedPurchaseIds.size === filteredPurchases.length && filteredPurchases.length > 0}
                  onCheckedChange={toggleSelectAllPurchases}
                  aria-label="Select all purchases"
                />
                <label htmlFor="select-all-purchases" className="text-sm text-muted-foreground">Select all</label>
                {selectedPurchaseIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash className="mr-1 size-4" />
                    Delete {selectedPurchaseIds.size} selected
                  </Button>
                )}
              </div>
              <div className="space-y-1">
              {filteredPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={selectedPurchaseIds.has(purchase.id)}
                    onCheckedChange={() => togglePurchaseSelect(purchase.id)}
                    aria-label={`Select ${purchase.item_name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{purchase.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(purchase.purchased_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        statusColors[purchase.category as keyof typeof statusColors]
                      )}
                    >
                      {purchase.category}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(purchase.price), currency, locale)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEditPurchase(purchase)}
                      aria-label={`Edit ${purchase.item_name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {purchases.length >= purchaseLimit && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setPurchaseLimit((n) => n + 50)}
                >
                  Load more
                </Button>
              )}
            </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="menu" className="mt-3">
          <Dialog open={editMenuOpen} onOpenChange={(o) => { setEditMenuOpen(o); if (!o) setEditingMenuItem(null); }}>
            <DialogContent>
              <form onSubmit={handleEditMenu}>
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                  <DialogDescription>Update name, price, or category</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div>
                    <Label htmlFor="edit_item_name">Item Name</Label>
                    <Input
                      id="edit_item_name"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_price">Price</Label>
                    <Input
                      id="edit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm((f) => ({ ...f, price: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={menuForm.category}
                      onValueChange={(v) =>
                        setMenuForm((f) => ({ ...f, category: v as MenuCategory }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vending">Vending</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateMenuMutation.isPending}>
                    {updateMenuMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="w-full mb-3"
            onClick={() => addFromTemplatesMutation.mutate()}
            disabled={addFromTemplatesMutation.isPending || !profileId}
          >
            <Copy className="mr-2 size-4" />
            Add from templates
          </Button>
          {menuItemsError ? (
            <QueryError
              error={menuItemsErrorObj ?? null}
              refetch={refetchMenuItems}
              message="Failed to load menu"
            />
          ) : menuItems.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="No menu items yet"
              description="Add from templates above or create custom items."
              action={
                <Button size="sm" onClick={openAddMenu}>
                  <Plus className="mr-1 size-4" />
                  Add item
                </Button>
              }
            />
          ) : (
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        statusColors[item.category]
                      )}
                    >
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(item.price, currency, locale)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEditMenu(item)}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => {
                        setDeleteTarget({ type: "menu", id: item.id });
                        setDeleteConfirmOpen(true);
                      }}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => { setBulkDeleteOpen(o); if (!o) setSelectedPurchaseIds(new Set()); }}
        onConfirm={() => handleBulkDeletePurchases(Array.from(selectedPurchaseIds))}
        title={`Delete ${selectedPurchaseIds.size} purchase(s)?`}
        description="This action cannot be undone."
        isLoading={bulkDeleteInProgress}
      />
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => {
          setDeleteConfirmOpen(o);
          if (!o) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "menu") {
            deleteMenuMutation.mutate(deleteTarget.id);
          } else {
            deletePurchaseMutation.mutate(deleteTarget.id);
          }
        }}
        title={deleteTarget?.type === "menu" ? "Delete menu item?" : "Delete purchase?"}
        description="This action cannot be undone."
        isLoading={
          deleteTarget?.type === "menu"
            ? deleteMenuMutation.isPending
            : deletePurchaseMutation.isPending
        }
      />
    </div>
  );
}
