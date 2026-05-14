import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { masterlistExportUrl, useMasterlist, AFFILIATIONS, type Affiliation, type MasterlistRow } from "@/features/masterlists/hooks";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { Download, Search, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Pencil, UserPlus } from "lucide-react";
import { Portal } from "@/components/ui/portal";
import { DateInput } from "@/components/ui/date-input";
import { formatDate } from "@/lib/utils";

const AFFILIATION_TONE: Record<Affiliation, "upcoming" | "ongoing" | "completed"> = {
  Binhi: "upcoming",
  Kadiwa: "ongoing",
  Buklod: "completed",
};

/* ── Import Modal ───────────────────────────────────────── */
interface ImportResult {
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.append("file", f);
      const { data } = await api.post<ImportResult>("/admin/masterlists/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (d) => {
      setResult(d);
      onDone();
    },
    onError: () => toast({ title: "Import failed", variant: "error" }),
  });

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-brand-green" />
            <h2 className="font-semibold">Import Masterlist from Excel</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* Template download */}
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium mb-1">Step 1 — Download the template</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Fill in the template then upload. Required columns:{" "}
                  <code className="text-xs bg-muted px-1 rounded">first_name</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded">last_name</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded">belongs_to</code>{" "}
                  (Binhi / Kadiwa / Buklod). Optional:{" "}
                  <code className="text-xs bg-muted px-1 rounded">purok</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded">grupo</code> (free text),{" "}
                  <code className="text-xs bg-muted px-1 rounded">birthdate</code>.
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Names are automatically normalized to Title Case. Duplicate entries (same first name + last name + group) will be skipped.
                </p>
                <Button variant="secondary" size="sm" asChild>
                  <a href="/api/v1/admin/masterlists/import-template" download>
                    <Download className="size-4" /> Download Template (.xlsx)
                  </a>
                </Button>
              </div>

              {/* File upload */}
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium mb-3">Step 2 — Upload your file</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-8 cursor-pointer hover:border-brand-green/40 hover:bg-brand-green/5 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  {file ? (
                    <p className="text-sm font-medium text-brand-green">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to select file</p>
                      <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, or .csv — max 5 MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button
                  variant="default"
                  disabled={!file || importMutation.isPending}
                  loading={importMutation.isPending}
                  onClick={() => file && importMutation.mutate(file)}
                >
                  <Upload className="size-4" />
                  {importMutation.isPending ? "Importing…" : "Import"}
                </Button>
              </div>
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-brand-green/5 border border-brand-green/20 px-4 py-3">
                <CheckCircle2 className="size-5 text-brand-green shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Import complete</p>
                  <p className="text-xs text-muted-foreground">
                    {result.imported} imported · {result.skipped} skipped (duplicates)
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                    <AlertCircle className="size-3.5" /> Row errors
                  </p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-700">{err}</p>
                  ))}
                </div>
              )}
              <Button variant="default" className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </Portal>
  );
}

/* ── Add / Edit Member Modal ────────────────────────────── */
interface MemberForm {
  first_name: string;
  middle_name: string;
  last_name: string;
  belongs_to: Affiliation | "";
  purok: string;
  grupo: string;
  email: string;
  phone: string;
  birthdate: string;
}

const BLANK_FORM: MemberForm = {
  first_name: "", middle_name: "", last_name: "",
  belongs_to: "", purok: "", grupo: "", email: "", phone: "", birthdate: "",
};

function AddEditMemberModal({
  row,
  onClose,
  onDone,
}: {
  row?: MasterlistRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = !!row;
  const [form, setForm] = useState<MemberForm>(
    row
      ? {
          first_name: row.first_name,
          middle_name: row.middle_name ?? "",
          last_name: row.last_name,
          belongs_to: row.belongs_to,
          purok: row.purok ?? "",
          grupo: row.grupo ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          birthdate: row.birthdate ?? "",
        }
      : BLANK_FORM,
  );

  const set = (k: keyof MemberForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        middle_name: form.middle_name || null,
        purok: form.purok || null,
        grupo: form.grupo || null,
        email: form.email || null,
        phone: form.phone || null,
        birthdate: form.birthdate || null,
      };
      if (isEdit) {
        return api.put(`/admin/masterlists/${row!.id}`, payload);
      }
      return api.post("/admin/masterlists", payload);
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Member updated." : "Member added.", variant: "success" });
      onDone();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Something went wrong.";
      toast({ title: msg, variant: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.belongs_to) {
      toast({ title: "Belongs To is required", variant: "error" });
      return;
    }
    mutation.mutate();
  };

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h2 className="font-semibold">{isEdit ? "Edit Member" : "Add Member"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">First Name <span className="text-red-500">*</span></label>
              <Input required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="Juan" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Last Name <span className="text-red-500">*</span></label>
              <Input required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="Dela Cruz" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Middle Name</label>
            <Input value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Belongs To <span className="text-red-500">*</span></label>
            <Select value={form.belongs_to || ""} onChange={(e) => set("belongs_to", e.target.value)} className="w-full">
              <option value="" disabled>Select affiliation…</option>
              {AFFILIATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Purok</label>
              <Input value={form.purok} onChange={(e) => set("purok", e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Grupo</label>
              <Input value={form.grupo} onChange={(e) => set("grupo", e.target.value)} placeholder="e.g. 1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xx-xxx-xxxx" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Birthdate</label>
            <DateInput
              value={form.birthdate}
              onChange={(iso) => set("birthdate", iso)}
              max={new Date().toISOString().split("T")[0]}
              placeholder="e.g. May 21, 2002 or 5/21/02"
              hint="Used to generate the login code."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" disabled={mutation.isPending} loading={mutation.isPending}>
              {isEdit ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  );
}

export default function AdminMasterlistsPage() {
  const [q, setQ] = useState("");
  const [belongsTo, setBelongsTo] = useState<Affiliation | "">("");
  const [grupo, setGrupo] = useState("");
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingRow, setEditingRow] = useState<MasterlistRow | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useMasterlist({ q, belongs_to: belongsTo || undefined, grupo: grupo || undefined, page });

  return (
    <div>
      <PageHeader
        title="Masterlists"
        description="A unified view of every member who has engaged with your community."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="size-4" /> Import Excel
            </Button>
            <Button variant="secondary" asChild>
              <a href={masterlistExportUrl({ q, belongs_to: belongsTo })} target="_blank" rel="noreferrer">
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
            <Button variant="default" onClick={() => setShowAdd(true)}>
              <UserPlus className="size-4" /> Add Member
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, phone…" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <Input
            placeholder="Filter by Grupo…"
            className="w-full md:w-44"
            value={grupo}
            onChange={(e) => { setGrupo(e.target.value); setPage(1); }}
          />
          <Select
            className="w-full md:w-56"
            value={belongsTo || "all"}
            onChange={(e) => {
              setBelongsTo(e.target.value === "all" ? "" : (e.target.value as Affiliation));
              setPage(1);
            }}
          >
            <option value="all">All affiliations</option>
            {AFFILIATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Last name</TableHead>
                  <TableHead>First name</TableHead>
                  <TableHead>M.I.</TableHead>
                  <TableHead>Belongs to</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Surveys</TableHead>
                  <TableHead>Login Code</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data?.length ?? 0) === 0 ? (
                  <TableEmpty colSpan={13}>No members yet.</TableEmpty>
                ) : (
                  data!.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.last_name}</TableCell>
                      <TableCell>{row.first_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.middle_name ? `${row.middle_name.charAt(0)}.` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge tone={AFFILIATION_TONE[row.belongs_to] ?? "neutral"}>{row.belongs_to}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.purok ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.grupo ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.email ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.phone ?? "—"}</TableCell>
                      <TableCell className="text-right">{row.events_count}</TableCell>
                      <TableCell className="text-right">{row.surveys_count}</TableCell>
                      <TableCell>
                        {row.login_code ? (
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                            {row.login_code}
                          </code>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.last_activity_at ? formatDate(row.last_activity_at) : "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit member"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {data && data.meta.last_page > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Page {data.meta.current_page} of {data.meta.last_page}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => queryClient.invalidateQueries({ queryKey: ["masterlists"] })}
        />
      )}
      {(showAdd || editingRow) && (
        <AddEditMemberModal
          row={editingRow ?? undefined}
          onClose={() => { setShowAdd(false); setEditingRow(null); }}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["masterlists"] });
            setShowAdd(false);
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}
