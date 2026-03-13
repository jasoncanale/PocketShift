"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as eventsApi from "@/lib/api/events";
import * as contactsApi from "@/lib/api/contacts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Plus, Pencil, Trash2, Check, Square, CalendarDays, Loader2, Download, Trash, FileUp, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { statusColors } from "@/lib/colors";
import { eventSchema } from "@/lib/validations";
import { isOfflineQueued } from "@/lib/offline-mutation";
import { downloadCsv, parseCsvRow } from "@/lib/csv-export";
import { format } from "date-fns";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Event, EventInsert, EventStatus, ChecklistItem, Contact } from "@/lib/types";

function generateId() {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const eventStatusColors: Record<EventStatus, string> = {
  todo: statusColors.todo,
  in_progress: statusColors.in_progress,
  done: statusColors.done,
};

export default function EventsPage() {
  const { activeProfile } = useProfile();
  const { formatDate } = useDateFormat();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "",
    status: "todo" as EventStatus,
    recurrence_rule: "" as "" | "daily" | "weekly" | "monthly",
    recurrence_end: "",
    checklist: [] as ChecklistItem[],
    contact_ids: [] as string[],
  });

  const profileId = activeProfile?.id;

  useKeyboardShortcuts({ onAdd: () => setOpen(true) });

  const { data: events = [], isLoading: eventsLoading, isError: eventsError, error: eventsErrorObj, refetch: refetchEvents } = useQuery({
    queryKey: ["events", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return eventsApi.getEvents(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return contactsApi.getContacts(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const createMutation = useMutation({
    mutationFn: async (event: EventInsert) => eventsApi.createEvent(supabase, event),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setEditingEvent(null);
      setForm({ title: "", description: "", due_date: "", due_time: "", status: "todo", recurrence_rule: "", recurrence_end: "", checklist: [], contact_ids: [] });
      toast.success("Event created");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create event"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      due_date,
      due_time,
      status,
      recurrence_rule,
      recurrence_end,
      checklist,
      contact_ids,
    }: {
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      due_time: string | null;
      status: EventStatus;
      recurrence_rule?: string | null;
      recurrence_end?: string | null;
      checklist?: ChecklistItem[] | null;
      contact_ids?: string[] | null;
    }) =>
      eventsApi.updateEvent(supabase, id, {
        title,
        description,
        due_date,
        due_time,
        status,
        recurrence_rule: recurrence_rule ?? undefined,
        recurrence_end: recurrence_end ?? undefined,
        checklist: checklist ?? undefined,
        contact_ids: contact_ids ?? undefined,
      }),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setEditingEvent(null);
      setForm({ title: "", description: "", due_date: "", due_time: "", status: "todo", recurrence_rule: "", recurrence_end: "", checklist: [], contact_ids: [] });
      toast.success("Event updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update event"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EventStatus }) =>
      eventsApi.updateEventStatus(supabase, id, status),
    onSuccess: (data) => {
      if (!isOfflineQueued(data)) queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => eventsApi.deleteEvent(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      toast.success("Event deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete event"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;

    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    const recurrenceRule = form.recurrence_rule || null;
    const recurrenceEnd = form.recurrence_end || null;
    const dueTime = form.due_time
      ? form.due_time.length === 5
        ? `${form.due_time}:00`
        : form.due_time
      : null;

    const contactIds = form.contact_ids.length ? form.contact_ids : null;

    if (editingEvent) {
      updateMutation.mutate({
        id: editingEvent.id,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        due_time: dueTime,
        status: form.status,
        recurrence_rule: recurrenceRule,
        recurrence_end: recurrenceEnd,
        checklist: form.checklist.length ? form.checklist : null,
        contact_ids: contactIds,
      });
    } else {
      createMutation.mutate({
        profile_id: profileId,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        due_time: dueTime,
        status: form.status,
        recurrence_rule: recurrenceRule,
        recurrence_end: recurrenceEnd,
        checklist: form.checklist.length ? form.checklist : null,
        contact_ids: contactIds,
      });
    }
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    const checklist = (event as Event & { checklist?: ChecklistItem[] | null }).checklist ?? [];
    const contactIds = (event as Event & { contact_ids?: string[] | null }).contact_ids ?? [];
    setForm({
      title: event.title,
      description: event.description || "",
      due_date: event.due_date || "",
      due_time: event.due_time ? event.due_time.slice(0, 5) : "",
      status: event.status ?? "todo",
      recurrence_rule: (event.recurrence_rule as "" | "daily" | "weekly" | "monthly") || "",
      recurrence_end: event.recurrence_end || "",
      checklist: Array.isArray(checklist) ? checklist : [],
      contact_ids: Array.isArray(contactIds) ? contactIds : [],
    });
    setNewChecklistItem("");
    setOpen(true);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ title: "", description: "", due_date: "", due_time: "", status: "todo", recurrence_rule: "", recurrence_end: "", checklist: [], contact_ids: [] });
    setNewChecklistItem("");
    setOpen(true);
  };

  const statusFiltered = filter === "all" ? events : events.filter((e) => e.status === filter);
  const q = search.trim().toLowerCase();
  const filtered = q
    ? statusFiltered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description?.toLowerCase().includes(q) ?? false)
      )
    : statusFiltered;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
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
      const hasHeader = header?.includes("title");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        if (!line.trim()) continue;
        const cols = parseCsvRow(line);
        const title = cols[0] ?? "";
        const description = cols[1] ?? null;
        const due_date = cols[2] ?? null;
        const due_time = cols[3] ?? null;
        const status = (cols[4] ?? "todo") as "todo" | "in_progress" | "done";
        const recurrence_rule = (cols[5] ?? null) as "" | "daily" | "weekly" | "monthly" | null;

        const parsed = eventSchema.safeParse({
          title,
          description: description || undefined,
          due_date: due_date || undefined,
          due_time: due_time || undefined,
          status: ["todo", "in_progress", "done"].includes(status) ? status : "todo",
          recurrence_rule: recurrence_rule && ["daily", "weekly", "monthly"].includes(recurrence_rule) ? recurrence_rule : null,
        });

        if (parsed.success && parsed.data) {
          try {
            const res = await eventsApi.createEvent(supabase, {
              profile_id: profileId,
              title: parsed.data.title,
              description: parsed.data.description ?? null,
              due_date: parsed.data.due_date ?? null,
              due_time: parsed.data.due_time ?? null,
              status: parsed.data.status,
              recurrence_rule: parsed.data.recurrence_rule ?? null,
              recurrence_end: null,
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

      if (queued === 0) queryClient.invalidateQueries({ queryKey: ["events"] });
      const parts = [];
      if (success > 0) parts.push(`Imported ${success}`);
      if (queued > 0) parts.push(`${queued} saved offline`);
      if (errors > 0) parts.push(`${errors} failed`);
      toast.success(parts.length ? parts.join(", ") : "No events imported");
    } finally {
      setImportInProgress(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setBulkDeleteInProgress(true);
    try {
      let queued = 0;
      for (const id of ids) {
        const res = await eventsApi.deleteEvent(supabase, id);
        if (isOfflineQueued(res)) queued++;
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      if (queued > 0) {
        toast.success(queued === ids.length ? "Saved offline, will sync when back online" : `${queued} saved offline, rest deleted`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast.success(`${ids.length} event(s) deleted`);
      }
    } finally {
      setBulkDeleteInProgress(false);
    }
  };

  const handleChecklistToggle = (event: Event, itemId: string) => {
    const checklist = (event as Event & { checklist?: ChecklistItem[] | null }).checklist ?? [];
    if (!Array.isArray(checklist) || checklist.length === 0) return;

    const updated = checklist.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i
    );
    const doneCount = updated.filter((i) => i.done).length;
    const total = updated.length;
    const newStatus: EventStatus =
      doneCount === total ? "done" : doneCount > 0 ? "in_progress" : (event.status ?? "todo");

    const contactIds = (event as Event & { contact_ids?: string[] | null }).contact_ids ?? null;
    updateMutation.mutate({
      id: event.id,
      title: event.title,
      description: event.description || null,
      due_date: event.due_date || null,
      due_time: event.due_time || null,
      status: newStatus,
      recurrence_rule: event.recurrence_rule || null,
      recurrence_end: event.recurrence_end || null,
      checklist: updated,
      contact_ids: contactIds,
    });
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
        <h1 className="text-xl font-bold">Events</h1>
        <div className="flex gap-2">
          <Input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <TooltipDesktop content="Import events from CSV">
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
          <TooltipDesktop content="Export events to CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
              const headers = ["Title", "Description", "Due Date", "Due Time", "Status", "Recurrence", "Created"];
              const rows = filtered.map((e) => [
                e.title,
                e.description ?? "",
                e.due_date ?? "",
                e.due_time ? String(e.due_time).slice(0, 5) : "",
                e.status ?? "todo",
                e.recurrence_rule ?? "",
                e.created_at ? format(new Date(e.created_at), "yyyy-MM-dd HH:mm") : "",
              ]);
              downloadCsv(headers, rows, `events-${format(new Date(), "yyyy-MM-dd")}.csv`);
              toast.success("Events exported");
            }}
            disabled={filtered.length === 0}
          >
            <Download className="mr-1 size-4" />
            Export
          </Button>
          </TooltipDesktop>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingEvent(null); }}>
          <TooltipDesktop content={<>Add event <KbdGroup><Kbd>Ctrl</Kbd><Kbd>N</Kbd></KbdGroup></>}>
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
                <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
                <DialogDescription>
                  Create a project or task
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date (optional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="due_time">Due Time (optional)</Label>
                  <Input
                    id="due_time"
                    type="time"
                    value={form.due_time}
                    onChange={(e) => setForm((f) => ({ ...f, due_time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventStatus }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recurrence (optional)</Label>
                  <Select
                    value={form.recurrence_rule || "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, recurrence_rule: v === "none" ? "" : (v as "daily" | "weekly" | "monthly") }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.recurrence_rule && (
                  <div>
                    <Label htmlFor="recurrence_end">Repeat until (optional)</Label>
                    <Input
                      id="recurrence_end"
                      type="date"
                      value={form.recurrence_end}
                      onChange={(e) => setForm((f) => ({ ...f, recurrence_end: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                )}
                {contacts.length > 0 && (
                  <div>
                    <Label>People</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Link people to this event
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contacts.map((c: Contact) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={form.contact_ids.includes(c.id)}
                            onCheckedChange={(checked) =>
                              setForm((f) => ({
                                ...f,
                                contact_ids: checked
                                  ? [...f.contact_ids, c.id]
                                  : f.contact_ids.filter((id) => id !== c.id),
                              }))
                            }
                          />
                          <span>{c.first_name} {c.last_name ?? ""}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Checklist</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add to-do items. Ticking items updates status automatically.
                  </p>
                  <div className="mt-2 space-y-2">
                    {form.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() =>
                            setForm((f) => {
                              const updated = f.checklist.map((i) =>
                                i.id === item.id ? { ...i, done: !i.done } : i
                              );
                              const doneCount = updated.filter((i) => i.done).length;
                              const total = updated.length;
                              const newStatus: EventStatus =
                                doneCount === total ? "done" : doneCount > 0 ? "in_progress" : f.status;
                              return { ...f, checklist: updated, status: newStatus };
                            })
                          }
                          aria-label={item.done ? "Mark incomplete" : "Mark done"}
                        >
                          {item.done ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Input
                          value={item.text}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              checklist: f.checklist.map((i) =>
                                i.id === item.id ? { ...i, text: e.target.value } : i
                              ),
                            }))
                          }
                          className={cn("flex-1", item.done && "line-through text-muted-foreground")}
                          placeholder="Item"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-destructive"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              checklist: f.checklist.filter((i) => i.id !== item.id),
                            }))
                          }
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newChecklistItem.trim()) {
                              setForm((f) => ({
                                ...f,
                                checklist: [...f.checklist, { id: generateId(), text: newChecklistItem.trim(), done: false }],
                              }));
                              setNewChecklistItem("");
                            }
                          }
                        }}
                        placeholder="Add item..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newChecklistItem.trim()) {
                            setForm((f) => ({
                              ...f,
                              checklist: [...f.checklist, { id: generateId(), text: newChecklistItem.trim(), done: false }],
                            }));
                            setNewChecklistItem("");
                          }
                        }}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {editingEvent ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    editingEvent ? "Save" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="todo" className="flex-1">To Do</TabsTrigger>
          <TabsTrigger value="in_progress" className="flex-1">In Progress</TabsTrigger>
          <TabsTrigger value="done" className="flex-1">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all-events"
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all events"
          />
          <label htmlFor="select-all-events" className="text-sm text-muted-foreground">Select all</label>
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
      )}

      {eventsError ? (
        <QueryError
          error={eventsErrorObj ?? null}
          refetch={refetchEvents}
          message="Failed to load events"
        />
      ) : eventsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No events found
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create a project or task to get started."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 size-4" />
                Add event
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <Card key={event.id}>
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedIds.has(event.id)}
                      onCheckedChange={() => toggleSelect(event.id)}
                      aria-label={`Select ${event.title}`}
                    />
                    <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    {event.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                    {(() => {
                      const contactIds = (event as Event & { contact_ids?: string[] | null }).contact_ids;
                      const ids = Array.isArray(contactIds) ? contactIds : [];
                      if (ids.length > 0) {
                        const names = ids
                          .map((id) => contacts.find((c) => c.id === id))
                          .filter(Boolean)
                          .map((c) => `${(c as Contact).first_name} ${(c as Contact).last_name ?? ""}`.trim());
                        if (names.length > 0) {
                          return (
                            <p className="mt-1 text-xs text-muted-foreground">
                              People: {names.join(", ")}
                            </p>
                          );
                        }
                      }
                      return null;
                    })()}
                    {(() => {
                      const checklist = (event as Event & { checklist?: ChecklistItem[] | null }).checklist;
                      const items = Array.isArray(checklist) ? checklist : [];
                      if (items.length === 0) return null;
                      return (
                        <div className="mt-2 space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                onClick={() => handleChecklistToggle(event, item.id)}
                                disabled={updateMutation.isPending}
                                aria-label={item.done ? "Mark incomplete" : "Mark done"}
                              >
                                {item.done ? (
                                  <Check className="size-3.5 text-primary" />
                                ) : (
                                  <Square className="size-3.5 text-muted-foreground" />
                                )}
                              </Button>
                              <span
                                className={cn(
                                  "flex-1 min-w-0",
                                  item.done && "line-through text-muted-foreground"
                                )}
                              >
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Select
                        value={event.status ?? "todo"}
                        onValueChange={(v) =>
                          updateStatusMutation.mutate({
                            id: event.id,
                            status: v as EventStatus,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-auto">
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", eventStatusColors[event.status ?? "todo"])}
                          >
                            {(event.status ?? "todo").replace("_", " ")}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      {event.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due {formatDate(event.due_date)}
                          {event.due_time && ` ${event.due_time.slice(0, 5)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => openEdit(event)}
                      aria-label={`Edit ${event.title}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => {
                        setDeleteTargetId(event.id);
                        setDeleteConfirmOpen(true);
                      }}
                      aria-label={`Delete ${event.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => {
          setDeleteConfirmOpen(o);
          if (!o) setDeleteTargetId(null);
        }}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        title="Delete event?"
        description="This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => handleBulkDelete(Array.from(selectedIds))}
        title={`Delete ${selectedIds.size} event(s)?`}
        description="This action cannot be undone."
        isLoading={bulkDeleteInProgress}
      />
    </div>
  );
}
