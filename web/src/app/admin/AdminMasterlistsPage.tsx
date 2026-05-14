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
import { masterlistExportUrl, useMasterlist, AFFILIATIONS, type Affiliation } from "@/features/masterlists/hooks";
import { toast } from "@/components/ui/toaster";
import { api } from "@/lib/api";
import { Download, Search, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
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
                  <code className="text-xs bg-muted px-1 rounded">grupo</code>,{" "}
                  <code className="text-xs bg-muted px-1 rounded">purok</code>,{" "}
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
              <Button className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMasterlistsPage() {
  const [q, setQ] = useState("");
  const [belongsTo, setBelongsTo] = useState<Affiliation | "">("");
  const [grupo, setGrupo] = useState("");
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useMasterlist({ q, belongs_to: belongsTo || undefined, grupo: grupo || undefined, page });

  return (
    <div>
      <PageHeader
        title="Masterlists"
        description="A unified view of every member who has engaged with your community."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="size-4" /> Import Excel
            </Button>
            <Button variant="default" asChild>
              <a href={masterlistExportUrl({ q, belongs_to: belongsTo })} target="_blank" rel="noreferrer">
                <Download className="size-4" /> Export CSV
              </a>
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
                  <TableHead>Grupo</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Surveys</TableHead>
                  <TableHead>Login Code</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data?.length ?? 0) === 0 ? (
                  <TableEmpty colSpan={12}>No members yet.</TableEmpty>
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
                      <TableCell className="text-sm text-muted-foreground">{row.grupo ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.purok ?? "—"}</TableCell>
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
    </div>
  );
}
