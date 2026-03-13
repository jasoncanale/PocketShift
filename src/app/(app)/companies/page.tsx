"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import * as companiesApi from "@/lib/api/companies";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/providers/profile-provider";
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
import { CompanyLogo } from "@/components/profiles/company-logo";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { QueryError } from "@/components/query-error";
import { EmptyState } from "@/components/empty-state";
import { Plus, Pencil, Trash2, Upload, X, Building2, Loader2, Download, Trash, Search } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/storage";
import { DEFAULT_MENU_TEMPLATES } from "@/lib/menu-templates";
import { useDateFormat } from "@/lib/hooks/use-date-format";
import { profileSchema } from "@/lib/validations";
import { formatError } from "@/lib/error-utils";
import { isOfflineQueued } from "@/lib/offline-mutation";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { TooltipDesktop } from "@/components/tooltip-desktop";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { Profile, ProfileInsert } from "@/lib/types";
import { CURRENCIES } from "@/lib/types";
import { downloadCsv } from "@/lib/csv-export";
import { format } from "date-fns";

export default function CompaniesPage() {
  const { user } = useAuth();
  const { activeProfile, setActiveProfile, refreshProfiles } = useProfile();
  const { formatDate } = useDateFormat();

  useKeyboardShortcuts({ onAdd: () => setOpen(true) });
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profiles = [], isLoading: profilesLoading, isError: profilesError, error: profilesErrorObj, refetch: refetchProfiles } = useQuery({
    queryKey: ["profiles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return companiesApi.getProfiles(supabase, user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const q = search.trim().toLowerCase();
  const filteredProfiles = q
    ? profiles.filter((p) => p.company_name.toLowerCase().includes(q))
    : profiles;

  const createMutation = useMutation({
    mutationFn: async (profile: ProfileInsert) => {
      const menuTemplates = DEFAULT_MENU_TEMPLATES.map((t) => ({
        name: t.name,
        price: t.price,
        category: t.category,
        is_default: true,
      }));
      return companiesApi.createProfile(supabase, profile, menuTemplates);
    },
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      refreshProfiles();
      setOpen(false);
      setCompanyName("");
      toast.success("Company created");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      company_name,
      logo_url,
      currency,
    }: {
      id: string;
      company_name: string;
      logo_url?: string | null;
      currency?: string | null;
    }) => {
      const updates: { company_name: string; logo_url?: string | null; currency?: string | null } = {
        company_name,
      };
      if (logo_url !== undefined) updates.logo_url = logo_url;
      if (currency !== undefined) updates.currency = currency;
      await companiesApi.updateProfile(supabase, id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      refreshProfiles();
      setOpen(false);
      setEditingProfile(null);
      setCompanyName("");
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Company updated");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => companiesApi.deleteProfile(supabase, id),
    onSuccess: (data) => {
      if (isOfflineQueued(data)) {
        toast.success("Saved offline, will sync when back online");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      refreshProfiles();
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      toast.success("Company deleted");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = profileSchema.safeParse({
      company_name: companyName,
      currency: currency ?? null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    let logoUrl: string | null = editingProfile?.logo_url ?? null;
    if (removeLogo) logoUrl = null;
    else if (logoFile) {
      const path = `profiles/${user.id}`;
      const result = await uploadAvatar(logoFile, path);
      if ("error" in result) {
        toast.error(result.error.message);
        return;
      }
      logoUrl = result.url;
    }

    if (editingProfile) {
      updateMutation.mutate({
        id: editingProfile.id,
        company_name: companyName,
        logo_url: logoUrl,
      });
    } else {
      createMutation.mutate({
        user_id: user.id,
        company_name: companyName,
        logo_url: logoUrl,
        is_active: profiles.length === 0,
      });
    }
  };

  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setCompanyName(profile.company_name);
    setCurrency(profile.currency ?? null);
    setLogoPreview(profile.logo_url);
    setLogoFile(null);
    setRemoveLogo(false);
    setOpen(true);
  };

  const openCreate = () => {
    setEditingProfile(null);
    setCompanyName("");
    setCurrency(null);
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
    setOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setRemoveLogo(false);
    }
    e.target.value = "";
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setBulkDeleteInProgress(true);
    try {
      let queued = 0;
      for (const id of ids) {
        const res = await companiesApi.deleteProfile(supabase, id);
        if (isOfflineQueued(res)) queued++;
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      refreshProfiles();
      if (queued > 0) {
        toast.success(queued === ids.length ? "Saved offline, will sync when back online" : `${queued} saved offline, rest deleted`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
        toast.success(`${ids.length} company(ies) deleted`);
      }
    } finally {
      setBulkDeleteInProgress(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Companies</h1>
        <div className="flex gap-2">
          <TooltipDesktop content="Export companies to CSV">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["Company Name", "Currency", "Created"];
                const rows = filteredProfiles.map((p) => [
                  p.company_name,
                  p.currency ?? "",
                  p.created_at ? format(new Date(p.created_at), "yyyy-MM-dd HH:mm") : "",
                ]);
                downloadCsv(headers, rows, `companies-${format(new Date(), "yyyy-MM-dd")}.csv`);
                toast.success("Companies exported");
              }}
              disabled={filteredProfiles.length === 0}
            >
              <Download className="mr-1 size-4" />
              Export
            </Button>
          </TooltipDesktop>
          <Dialog open={open} onOpenChange={setOpen}>
          <TooltipDesktop content={<>Add company <KbdGroup><Kbd>Ctrl</Kbd><Kbd>N</Kbd></KbdGroup></>}>
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
                <DialogTitle>
                  {editingProfile ? "Edit Company" : "New Company"}
                </DialogTitle>
                <DialogDescription>
                  {editingProfile
                    ? "Update the company name and logo"
                    : "Add a new company"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <CompanyLogo
                      src={
                        logoPreview ||
                        (!removeLogo && editingProfile?.logo_url) ||
                        undefined
                      }
                      fallback={companyName || "?"}
                      size="lg"
                    />
                    {(logoPreview || editingProfile?.logo_url) && !removeLogo && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-1 -top-1 size-6"
                        onClick={clearLogo}
                        aria-label="Remove logo"
                        aria-label="Remove logo"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-1 size-4" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency (optional override)</Label>
                  <Select
                    value={currency ?? "default"}
                    onValueChange={(v) => setCurrency(v === "default" ? null : v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Use user default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use user default</SelectItem>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    editingProfile ? "Save" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {profilesError ? (
        <QueryError
          error={profilesErrorObj ?? null}
          refetch={refetchProfiles}
          message="Failed to load companies"
        />
      ) : profilesLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Skeleton className="size-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
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
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {profiles.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Create a company to get started."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Add company
            </Button>
          }
        />
          ) : search && filteredProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No companies found
              </CardContent>
            </Card>
          ) : (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-companies"
              checked={selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all companies"
            />
            <label htmlFor="select-all-companies" className="text-sm text-muted-foreground">Select all</label>
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
          <div className="space-y-2">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="flex flex-row items-center gap-3 p-4">
                <Checkbox
                  checked={selectedIds.has(profile.id)}
                  onCheckedChange={() => toggleSelect(profile.id)}
                  aria-label={`Select ${profile.company_name}`}
                />
                <CompanyLogo
                  src={profile.logo_url}
                  fallback={profile.company_name}
                />
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {profile.company_name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Created {formatDate(profile.created_at)}
                  </CardDescription>
                </div>
                {activeProfile?.id === profile.id && (
                  <Badge>Active</Badge>
                )}
                <div className="flex gap-1">
                  {activeProfile?.id !== profile.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveProfile(profile)}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(profile)}
                    aria-label={`Edit ${profile.company_name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => {
                      setDeleteTargetId(profile.id);
                      setDeleteConfirmOpen(true);
                    }}
                    aria-label={`Delete ${profile.company_name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        </>
      )}
        </>
      )}
      <ConfirmDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => { setBulkDeleteOpen(o); if (!o) setSelectedIds(new Set()); }}
        onConfirm={() => handleBulkDelete(Array.from(selectedIds))}
        title={`Delete ${selectedIds.size} company(ies)?`}
        description="This will remove the companies and all associated data. This action cannot be undone."
        isLoading={bulkDeleteInProgress}
      />
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={(o) => {
          setDeleteConfirmOpen(o);
          if (!o) setDeleteTargetId(null);
        }}
        onConfirm={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
        title="Delete company?"
        description="This will remove the company and all associated data. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
