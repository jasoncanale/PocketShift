"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as contractsApi from "@/lib/api/contracts";
import { useProfile } from "@/providers/profile-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Plus, Pencil, Trash2, FileText, Loader2, Download, Trash, FileUp, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { statusColors } from "@/lib/colors";
import { contractSchema } from "@/lib/validations";
import { formatError } from "@/lib/error-utils";
import { isOfflineQueued } from "@/lib/offline-mutation";
import type { Contract, ContractInsert } from "@/lib/types";
import { downloadCsv, parseCsvRow } from "@/lib/csv-export";
import { format } from "date-fns";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export default function ContractsPage() {
  const { activeProfile } = useProfile();
  const { formatDate } = useDateFormat();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    start_date: "",
    duration_months: "",
    contract_type: "",
    notes: "",
  });

  const profileId = activeProfile?.id;

  useKeyboardShortcuts({ onAdd: () => setOpen(true) });

  const { data: contracts = [], isLoading: contractsLoading, isError: contractsError, error: contractsErrorObj, refetch: refetchContracts } = useQuery({
    queryKey: ["contracts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return contractsApi.getContracts(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const createMutation = useMutation({
    mutationFn: async (contract: ContractInsert) => contractsApi.createContract(supabase, contract),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setOpen(false);
      setForm({ start_date: "", duration_months: "", contract_type: "", notes: "" });
      toast.success("Contract added");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      start_date,
      duration_months,
      end_date,
      contract_type,
      notes,
    }: {
      id: string;
      start_date: string;
      duration_months: number | null;
      end_date: string | null;
      contract_type: string | null;
      notes: string | null;
    }) => {
      return contractsApi.updateContract(supabase, id, {
        start_date,
        duration_months,
        end_date,
        contract_type,
        notes,
      });
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setOpen(false);
      setEditingContract(null);
      setForm({ start_date: "", duration_months: "", contract_type: "", notes: "" });
      toast.success("Contract updated");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => contractsApi.deleteContract(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      toast.success("Contract deleted");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    const parsed = contractSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    const durationMonths = form.duration_months ? parseInt(form.duration_months) : null;
    let endDate: string | null = null;

    if (durationMonths && form.start_date) {
      const start = new Date(form.start_date);
      start.setMonth(start.getMonth() + durationMonths);
      endDate = start.toISOString().split("T")[0];
    }

    if (editingContract) {
      updateMutation.mutate({
        id: editingContract.id,
        start_date: form.start_date,
        duration_months: durationMonths,
        end_date: endDate,
        contract_type: form.contract_type || null,
        notes: form.notes || null,
      });
    } else {
      createMutation.mutate({
        profile_id: profileId,
        start_date: form.start_date,
        duration_months: durationMonths,
        end_date: endDate,
        contract_type: form.contract_type || null,
        notes: form.notes || null,
      });
    }
  };

  const openEdit = (contract: Contract) => {
    setEditingContract(contract);
    setForm({
      start_date: contract.start_date ?? "",
      duration_months: contract.duration_months ? String(contract.duration_months) : "",
      contract_type: contract.contract_type || "",
      notes: contract.notes || "",
    });
    setOpen(true);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const hasHeader = header?.includes("start") || header?.includes("date");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        if (!line.trim()) continue;
        const cols = parseCsvRow(line);
        const start_date = cols[0] ?? "";
        const duration_months = cols[1] ?? null;
        const end_date = cols[2] ?? null;
        const contract_type = cols[3] ?? null;
        const notes = cols[4] ?? null;

        const parsed = contractSchema.safeParse({
          start_date,
          duration_months: duration_months || undefined,
          contract_type: contract_type || undefined,
          notes: notes || undefined,
        });

        if (parsed.success && parsed.data) {
          try {
            const durationNum = duration_months ? parseInt(String(duration_months), 10) : null;
            let computedEndDate: string | null = null;
            if (durationNum && start_date) {
              const start = new Date(start_date);
              start.setMonth(start.getMonth() + durationNum);
              computedEndDate = start.toISOString().split("T")[0];
            }
            const res = await contractsApi.createContract(supabase, {
              profile_id: profileId,
              start_date: parsed.data.start_date,
              duration_months: durationNum,
              end_date: end_date || computedEndDate,
              contract_type: parsed.data.contract_type || null,
              notes: parsed.data.notes || null,
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

      if (queued === 0) queryClient.invalidateQueries({ queryKey: ["contracts"] });
      const parts = [];
      if (success > 0) parts.push(`Imported ${success}`);
      if (queued > 0) parts.push(`${queued} saved offline`);
      if (errors > 0) parts.push(`${errors} failed`);
      toast.success(parts.length ? parts.join(", ") : "No contracts imported");
    } finally {
      setImportInProgress(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = search.trim().toLowerCase();
  const filteredContracts = q
    ? contracts.filter(
        (c) =>
          (c.contract_type?.toLowerCase().includes(q) ?? false) ||
          (c.notes?.toLowerCase().includes(q) ?? false)
      )
    : contracts;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContracts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContracts.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setBulkDeleteInProgress(true);
    try {
      let queued = 0;
      for (const id of ids) {
        const res = await contractsApi.deleteContract(supabase, id);
        if (isOfflineQueued(res)) queued++;
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      if (queued > 0) {
        toast.success(queued === ids.length ? "Saved offline, will sync when back online" : `${queued} saved offline, rest deleted`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["contracts"] });
        toast.success(`${ids.length} contract(s) deleted`);
      }
    } finally {
      setBulkDeleteInProgress(false);
    }
  };

  const openCreate = () => {
    setEditingContract(null);
    setForm({ start_date: "", duration_months: "", contract_type: "", notes: "" });
    setOpen(true);
  };

  const getProgress = (contract: Contract) => {
    if (!contract.end_date || !contract.start_date) return null;
    const start = new Date(contract.start_date).getTime();
    const end = new Date(contract.end_date).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getStatus = (contract: Contract) => {
    if (!contract.start_date) return "active";
    const now = new Date();
    const start = new Date(contract.start_date);
    const end = contract.end_date ? new Date(contract.end_date) : null;

    if (now < start) return "upcoming";
    if (end && now > end) return "expired";
    return "active";
  };

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
        <h1 className="text-xl font-bold">Contracts</h1>
        <div className="flex gap-2">
          <Input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <TooltipDesktop content="Import contracts from CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={() => importInputRef.current?.click()}
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
          <TooltipDesktop content="Export contracts to CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
              const headers = ["Start Date", "Duration (months)", "End Date", "Contract Type", "Notes", "Created"];
              const rows = filteredContracts.map((c) => [
                c.start_date ?? "",
                c.duration_months ?? "",
                c.end_date ?? "",
                c.contract_type ?? "",
                c.notes ?? "",
                c.created_at ? format(new Date(c.created_at), "yyyy-MM-dd HH:mm") : "",
              ]);
              downloadCsv(headers, rows, `contracts-${format(new Date(), "yyyy-MM-dd")}.csv`);
              toast.success("Contracts exported");
            }}
            disabled={filteredContracts.length === 0}
          >
            <Download className="mr-1 size-4" />
            Export
          </Button>
          </TooltipDesktop>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingContract(null); }}>
          <TooltipDesktop content={<>Add contract <KbdGroup><Kbd>Ctrl</Kbd><Kbd>N</Kbd></KbdGroup></>}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Add
            </Button>
          </DialogTrigger>
          </TooltipDesktop>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingContract ? "Edit Contract" : "New Contract"}</DialogTitle>
                <DialogDescription>
                  Track a work contract
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={form.duration_months}
                    onChange={(e) => setForm((f) => ({ ...f, duration_months: e.target.value }))}
                    placeholder="e.g. 12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={form.contract_type}
                    onChange={(e) => setForm((f) => ({ ...f, contract_type: e.target.value }))}
                    placeholder="e.g. Full-time, Contract"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional details..."
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Saving...
                    </>
                  ) : (
                    editingContract ? "Save" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {contractsError ? (
        <QueryError
          error={contractsErrorObj ?? null}
          refetch={refetchContracts}
          message="Failed to load contracts"
        />
      ) : contractsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts yet"
          description="Track your contracts."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Add contract
            </Button>
          }
        />
          ) : search && filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No contracts found
              </CardContent>
            </Card>
          ) : (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-contracts"
              checked={selectedIds.size === filteredContracts.length && filteredContracts.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all contracts"
            />
            <label htmlFor="select-all-contracts" className="text-sm text-muted-foreground">Select all</label>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash className="mr-1 size-4" />
                Delete {selectedIds.size} selected
              </Button>
            )}
          </div>
          <div className="space-y-3">
          {filteredContracts.map((contract) => {
            const progress = getProgress(contract);
            const status = getStatus(contract);

            return (
              <Card key={contract.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Checkbox
                      checked={selectedIds.has(contract.id)}
                      onCheckedChange={() => toggleSelect(contract.id)}
                      aria-label={`Select ${contract.contract_type || "contract"}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">
                        {contract.contract_type || "Contract"}
                      </CardTitle>
                      <CardDescription>
                        {contract.start_date ? formatDate(contract.start_date) : "—"}
                        {contract.end_date && ` - ${formatDate(contract.end_date)}`}
                        {contract.duration_months &&
                          ` (${contract.duration_months} months)`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          status === "active" && statusColors.active,
                          status === "upcoming" && statusColors.upcoming,
                          status === "expired" && statusColors.expired
                        )}
                      >
                        {status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEdit(contract)}
                        aria-label="Edit contract"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => {
                          setDeleteTargetId(contract.id);
                          setDeleteConfirmOpen(true);
                        }}
                        aria-label="Delete contract"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {progress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  {contract.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {contract.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      )}
        </>
      )}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => { setBulkDeleteOpen(o); if (!o) setSelectedIds(new Set()); }}
        onConfirm={() => handleBulkDelete(Array.from(selectedIds))}
        title={`Delete ${selectedIds.size} contract(s)?`}
        description="This action cannot be undone."
        isLoading={bulkDeleteInProgress}
      />
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => {
          setDeleteConfirmOpen(o);
          if (!o) setDeleteTargetId(null);
        }}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        title="Delete contract?"
        description="This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
