import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Copy, MoreHorizontal, BarChart2, Map } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminSurveys, useDeleteSurvey, useQuickStatusUpdate, type SurveyStatus } from "@/features/surveys/hooks";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toaster";

export default function AdminSurveysPage() {
  const { data, isLoading } = useAdminSurveys();
  const del = useDeleteSurvey();
  const statusUpdate = useQuickStatusUpdate();

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete survey "${title}"?`)) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Survey deleted", variant: "success" });
    } catch {
      toast({ title: "Delete failed", variant: "error" });
    }
  };

  const handleStatusChange = async (id: number, status: SurveyStatus) => {
    try {
      await statusUpdate.mutateAsync({ id, status });
      toast({ title: "Status updated", variant: "success" });
    } catch {
      toast({ title: "Update failed", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Surveys"
        description="Build forms with conditional logic and conversion-friendly steps."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/surveys/map"><Map className="size-4" /> Map view</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/admin/surveys/new"><Plus className="size-4" /> New survey</Link>
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>QR</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.length ?? 0) === 0 ? (
                <TableEmpty colSpan={5}>No surveys yet.</TableEmpty>
              ) : (
                data!.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to={`/admin/surveys/${s.id}`} className="font-medium hover:underline">{s.title}</Link>
                      <p className="text-xs text-muted-foreground">/{s.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value as SurveyStatus)}
                        className="h-8 w-28 text-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.questions?.length ?? 0}</TableCell>
                    <TableCell>
                      {s.qr_token ? <Badge tone="upcoming">Enabled</Badge> : <Badge tone="neutral">—</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/surveys/${s.id}`}><Pencil className="size-4" /> Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/surveys/${s.id}/responses`}><BarChart2 className="size-4" /> View responses</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/surveys/${s.slug}`)}>
                            <Copy className="size-4" /> Copy public link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(s.id, s.title)} className="text-brand-red">
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
