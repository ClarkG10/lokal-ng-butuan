import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { masterlistExportUrl, useMasterlist, AFFILIATIONS, type Affiliation } from "@/features/masterlists/hooks";
import { Download, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

const AFFILIATION_TONE: Record<Affiliation, "upcoming" | "ongoing" | "completed"> = {
  Binhi: "upcoming",
  Kadiwa: "ongoing",
  Buklod: "completed",
};

export default function AdminMasterlistsPage() {
  const [q, setQ] = useState("");
  const [belongsTo, setBelongsTo] = useState<Affiliation | "">("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMasterlist({ q, belongs_to: belongsTo || undefined, page });

  return (
    <div>
      <PageHeader
        title="Masterlists"
        description="A unified view of every member who has engaged with your community."
        actions={
          <Button variant="default" asChild>
            <a href={masterlistExportUrl({ q, belongs_to: belongsTo })} target="_blank" rel="noreferrer">
              <Download className="size-4" /> Export CSV
            </a>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, phone…" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Surveys</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data?.length ?? 0) === 0 ? (
                  <TableEmpty colSpan={9}>No members yet.</TableEmpty>
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
                      <TableCell className="text-sm text-muted-foreground">{row.email ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.phone ?? "—"}</TableCell>
                      <TableCell className="text-right">{row.events_count}</TableCell>
                      <TableCell className="text-right">{row.surveys_count}</TableCell>
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
    </div>
  );
}
