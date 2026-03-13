"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as contactsApi from "@/lib/api/contacts";
import { useAuth } from "@/providers/auth-provider";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PersonAvatar } from "@/components/profiles/person-avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Plus, Pencil, Search, Trash2, Upload, X, Users, Loader2, Trash, FileUp, Download } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { getTagColor } from "@/lib/colors";
import { contactSchema } from "@/lib/validations";
import { formatError } from "@/lib/error-utils";
import { isOfflineQueued } from "@/lib/offline-mutation";
import { uploadImage } from "@/lib/storage";
import type { Contact, ContactInsert } from "@/lib/types";
import { GENDERS, ROLES } from "@/lib/types";
import { downloadCsv, parseCsvRow } from "@/lib/csv-export";
import { format } from "date-fns";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export default function ContactsPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { formatDate } = useDateFormat();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    department: "",
    role: "",
    gender: "" as "" | "male" | "female" | "other",
    met_date: "",
    notes: "",
  });

  const profileId = activeProfile?.id;

  useKeyboardShortcuts({ onAdd: () => setOpen(true) });

  const { data: contacts = [], isLoading: contactsLoading, isError: contactsError, error: contactsErrorObj, refetch: refetchContacts } = useQuery({
    queryKey: ["contacts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      return contactsApi.getContacts(supabase, profileId);
    },
    enabled: !!profileId,
  });

  const createMutation = useMutation({
    mutationFn: async (contact: ContactInsert) => contactsApi.createContact(supabase, contact),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setForm({ first_name: "", last_name: "", department: "", role: "", gender: "", met_date: "", notes: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success("Contact added");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      first_name,
      last_name,
      department,
      role,
      gender,
      photo_url,
      met_date,
      notes,
    }: {
      id: string;
      first_name: string;
      last_name: string | null;
      department: string | null;
      role: string | null;
      gender: string | null;
      photo_url: string | null;
      met_date: string | null;
      notes: string | null;
    }) => {
      return contactsApi.updateContact(supabase, id, {
        first_name,
        last_name,
        department,
        role,
        gender,
        photo_url,
        met_date,
        notes,
      });
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setEditingContact(null);
      setForm({ first_name: "", last_name: "", department: "", role: "", gender: "", met_date: "", notes: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success("Contact updated");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => contactsApi.deleteContact(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      toast.success("Contact deleted");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !user) return;

    const parsed = contactSchema.safeParse({
      first_name: form.first_name,
      last_name: form.last_name || undefined,
      department: form.department || undefined,
      role: form.role || null,
      gender: form.gender || null,
      met_date: form.met_date || undefined,
      notes: form.notes || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    let photoUrl: string | null = removePhoto ? null : (editingContact?.photo_url ?? null);
    if (photoFile) {
      const result = await uploadImage(photoFile, `contacts/${user.id}`);
      if ("error" in result) {
        toast.error(result.error.message);
        return;
      }
      photoUrl = result.url;
    }

    if (editingContact) {
      updateMutation.mutate({
        id: editingContact.id,
        first_name: form.first_name,
        last_name: form.last_name || null,
        department: form.department || null,
        role: form.role || null,
        gender: form.gender || null,
        photo_url: photoUrl,
        met_date: form.met_date || null,
        notes: form.notes || null,
      });
    } else {
      createMutation.mutate({
        profile_id: profileId,
        first_name: form.first_name,
        last_name: form.last_name || null,
        department: form.department || null,
        role: form.role || null,
        gender: form.gender || null,
        photo_url: photoUrl,
        met_date: form.met_date || null,
        notes: form.notes || null,
      });
    }
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    const c = contact as Contact & { role?: string | null };
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name || "",
      department: contact.department || "",
      role: c.role || "",
      gender: (contact.gender as "" | "male" | "female" | "other") || "",
      met_date: contact.met_date || "",
      notes: contact.notes || "",
    });
    setPhotoPreview(contact.photo_url);
    setPhotoFile(null);
    setRemovePhoto(false);
    setOpen(true);
  };

  const openCreate = () => {
    setEditingContact(null);
    setForm({ first_name: "", last_name: "", department: "", role: "", gender: "", met_date: "", notes: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(false);
    setOpen(true);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const filtered = search
    ? contacts.filter(
        (c) =>
          c.first_name.toLowerCase().includes(search.toLowerCase()) ||
          c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.department?.toLowerCase().includes(search.toLowerCase()) ||
          (c as Contact & { role?: string }).role?.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

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
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setBulkDeleteInProgress(true);
    try {
      let queued = 0;
      for (const id of ids) {
        const res = await contactsApi.deleteContact(supabase, id);
        if (isOfflineQueued(res)) queued++;
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      if (queued > 0) {
        toast.success(queued === ids.length ? "Saved offline, will sync when back online" : `${queued} saved offline, rest deleted`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.success(`${ids.length} contact(s) deleted`);
      }
    } finally {
      setBulkDeleteInProgress(false);
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
      const hasHeader = header?.includes("first") || header?.includes("name");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        if (!line.trim()) continue;
        const cols = parseCsvRow(line);
        const first_name = cols[0] ?? "";
        const last_name = cols[1] ?? null;
        const department = cols[2] ?? null;
        const gender = (cols[3] ?? null) as "" | "male" | "female" | "other" | null;
        const met_date = cols[4] ?? null;
        const notes = cols[5] ?? null;

        const parsed = contactSchema.safeParse({
          first_name,
          last_name: last_name || undefined,
          department: department || undefined,
          gender: gender && ["male", "female", "other"].includes(gender) ? gender : null,
          met_date: met_date || undefined,
          notes: notes || undefined,
        }) as { success: boolean; data?: { first_name: string; last_name?: string; department?: string; gender?: string | null; met_date?: string; notes?: string } };

        if (parsed.success && parsed.data) {
          try {
            const res = await contactsApi.createContact(supabase, {
              profile_id: profileId,
              first_name: parsed.data.first_name,
              last_name: parsed.data.last_name ?? null,
              department: parsed.data.department ?? null,
              gender: parsed.data.gender ?? null,
              photo_url: null,
              met_date: parsed.data.met_date ?? null,
              notes: parsed.data.notes ?? null,
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

      if (queued === 0) queryClient.invalidateQueries({ queryKey: ["contacts"] });
      const parts = [];
      if (success > 0) parts.push(`Imported ${success}`);
      if (queued > 0) parts.push(`${queued} saved offline`);
      if (errors > 0) parts.push(`${errors} failed`);
      toast.success(parts.length ? parts.join(", ") : "No people imported");
    } finally {
      setImportInProgress(false);
    }
  };

  const getPlaceholderSrc = (gender: string | null) => {
    if (gender === "male") return "/placeholders/male-placeholder.jpg";
    if (gender === "female") return "/placeholders/female-placeholder.jpg";
    return undefined;
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
        <h1 className="text-xl font-bold">People</h1>
        <div className="flex gap-2">
          <TooltipDesktop content="Export people to CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["First Name", "Last Name", "Department", "Role", "Gender", "Met Date", "Notes"];
                const rows = filtered.map((c) => [
                  c.first_name,
                  c.last_name ?? "",
                  c.department ?? "",
                  (c as Contact & { role?: string }).role ?? "",
                  c.gender ?? "",
                  c.met_date ?? "",
                  c.notes ?? "",
                ]);
                downloadCsv(headers, rows, `people-${format(new Date(), "yyyy-MM-dd")}.csv`);
                toast.success("Contacts exported");
              }}
              disabled={filtered.length === 0}
            >
              <Download className="mr-1 size-4" />
              Export
            </Button>
          </TooltipDesktop>
          <Input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <TooltipDesktop content="Import people from CSV">
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
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingContact(null); }}>
          <TooltipDesktop content={<>Add contact <KbdGroup><Kbd>Ctrl</Kbd><Kbd>N</Kbd></KbdGroup></>}>
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
                <DialogTitle>{editingContact ? "Edit Contact" : "New Contact"}</DialogTitle>
                <DialogDescription>Add someone you met at work</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarImage
                      src={
                        !removePhoto && (photoPreview || editingContact?.photo_url)
                          ? (photoPreview || editingContact?.photo_url || undefined)
                          : getPlaceholderSrc(form.gender || null)
                      }
                    />
                    <AvatarFallback>
                      {form.first_name.charAt(0)}
                      {form.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Label>Photo (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        ref={photoInputRef}
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Upload className="mr-1 size-4" />
                        Upload
                      </Button>
                      {(photoPreview || editingContact?.photo_url) && !removePhoto && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearPhoto}
                          aria-label="Remove photo"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Engineering"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={form.role || "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, role: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={form.gender || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, gender: v === "none" ? "" : (v as "male" | "female" | "other") }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="met_date">Date Met</Label>
                  <Input
                    id="met_date"
                    type="date"
                    value={form.met_date}
                    onChange={(e) => setForm((f) => ({ ...f, met_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
                    editingContact ? "Save" : "Add Contact"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
          </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all-people"
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all people"
          />
          <label htmlFor="select-all-people" className="text-sm text-muted-foreground">Select all</label>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {contactsError ? (
        <QueryError
          error={contactsErrorObj ?? null}
          refetch={refetchContacts}
          message="Failed to load people"
        />
      ) : contactsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No people found
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Users}
            title="No people yet"
            description="Add people you work with."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1 size-4" />
                Add person
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Checkbox
                  checked={selectedIds.has(contact.id)}
                  onCheckedChange={() => toggleSelect(contact.id)}
                  aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                />
                <PersonAvatar
                  src={
                    contact.photo_url
                      ? contact.photo_url
                      : getPlaceholderSrc(contact.gender) ?? undefined
                  }
                  fallback={`${contact.first_name.charAt(0)}${contact.last_name?.charAt(0) || ""}`}
                  size="default"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">
                    {contact.first_name} {contact.last_name || ""}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    {contact.department && (
                      <Badge variant="outline" className={cn("text-xs", getTagColor(contact.department))}>
                        {contact.department}
                      </Badge>
                    )}
                    {(contact as Contact & { role?: string }).role && (
                      <Badge variant="outline" className="text-xs">
                        {(contact as Contact & { role?: string }).role}
                      </Badge>
                    )}
                    {contact.gender && (
                      <span className="text-xs capitalize">{contact.gender}</span>
                    )}
                    {contact.met_date && (
                      <span className="text-xs">
                        Met {formatDate(contact.met_date)}
                      </span>
                    )}
                  </CardDescription>
                  {contact.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => openEdit(contact)}
                    aria-label={`Edit ${contact.first_name} ${contact.last_name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => {
                      setDeleteTargetId(contact.id);
                      setDeleteConfirmOpen(true);
                    }}
                    aria-label={`Delete ${contact.first_name} ${contact.last_name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
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
        title="Delete contact?"
        description="This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => handleBulkDelete(Array.from(selectedIds))}
        title={`Delete ${selectedIds.size} contact(s)?`}
        description="This action cannot be undone."
        isLoading={bulkDeleteInProgress}
      />
    </div>
  );
}
