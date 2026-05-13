import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AlertTriangle, Loader2 } from "lucide-react";
import { fetchSubmissions, updateHours } from "@/lib/api";
import {
  DEPARTMENTS,
  DEPARTMENT_CAPS,
  TOTAL_CAP,
  departmentLabel,
  totalHours,
  type Department,
  type HoursPerWeek,
  type Submission,
} from "@/lib/utils";

type TabKey = "all" | Department;

interface BudgetRow {
  label: string;
  allocated: number;
  cap: number;
}

function BudgetCards({ rows }: { rows: BudgetRow[] }) {
  const gridCols =
    rows.length === 1
      ? "sm:grid-cols-1"
      : rows.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {rows.map((row) => {
        const remaining = row.cap - row.allocated;
        const overBudget = remaining < 0;
        const nearCap = !overBudget && remaining <= 15;
        return (
          <Card
            key={row.label}
            className={
              overBudget
                ? "border-destructive/60 bg-destructive/5"
                : nearCap
                  ? "border-amber-500/60 bg-amber-500/5"
                  : ""
            }
          >
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                {overBudget && (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                )}
                {row.label}
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {row.allocated}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {row.cap}
                </span>
              </CardTitle>
              <p
                className={`text-xs ${
                  overBudget
                    ? "text-destructive"
                    : nearCap
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }`}
              >
                {remaining >= 0
                  ? `${remaining} hours remaining`
                  : `${Math.abs(remaining)} over budget`}
              </p>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

function SubmissionsTable({
  rows,
  showDepartment,
  onChangeHours,
  savingId,
}: {
  rows: Submission[];
  showDepartment: boolean;
  onChangeHours: (id: string, v: string) => void;
  savingId: string | null;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No submissions yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Submitted</th>
            {showDepartment && (
              <th className="py-2 pr-3 font-medium">Department</th>
            )}
            <th className="py-2 pr-3 font-medium">Counselor</th>
            <th className="py-2 pr-3 font-medium">Project</th>
            <th className="py-2 pr-3 font-medium">Extends AY</th>
            <th className="py-2 pr-3 font-medium">Hrs/wk</th>
            <th className="py-2 pr-3 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b align-top">
              <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                {new Date(s.timestamp).toLocaleDateString()}
              </td>
              {showDepartment && (
                <td className="py-3 pr-3 whitespace-nowrap">
                  {departmentLabel(s.department)}
                </td>
              )}
              <td className="py-3 pr-3 font-medium">{s.counselorName}</td>
              <td className="py-3 pr-3 max-w-[360px]">
                <div className="font-medium">{s.projectTitle}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {s.projectDescription}
                </div>
              </td>
              <td className="py-3 pr-3">
                {s.extendsAcademicYear ? (
                  <span>
                    Yes
                    <span className="block text-xs text-muted-foreground">
                      {s.continuedBy === "same"
                        ? "same counselor"
                        : "to be reassigned"}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </td>
              <td className="py-3 pr-3">
                <div className="w-24">
                  <Select
                    value={String(s.hoursPerWeek)}
                    onValueChange={(v) => onChangeHours(s.id, v)}
                    disabled={savingId === s.id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
              <td className="py-3 pr-3 text-right tabular-nums font-medium">
                {totalHours(s.hoursPerWeek)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPage() {
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem("adminToken") ?? "",
  );
  const [tokenInput, setTokenInput] = useState(adminToken);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSubmissions();
      setSubmissions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const allocatedByDept = useMemo(() => {
    const out: Record<Department, number> = { calworks: 0, sss: 0 };
    for (const s of submissions) {
      out[s.department] = (out[s.department] ?? 0) + totalHours(s.hoursPerWeek);
    }
    return out;
  }, [submissions]);

  const totalAllocated = allocatedByDept.calworks + allocatedByDept.sss;

  const handleChange = async (id: string, value: string) => {
    if (!adminToken) {
      setError("Enter the admin token to adjust hours.");
      return;
    }
    const hpw = Number(value) as HoursPerWeek;
    setSavingId(id);
    setError(null);
    const prev = submissions;
    setSubmissions((s) =>
      s.map((sub) => (sub.id === id ? { ...sub, hoursPerWeek: hpw } : sub)),
    );
    try {
      await updateHours(id, hpw, adminToken);
    } catch (e) {
      setSubmissions(prev);
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const saveToken = () => {
    setAdminToken(tokenInput);
    localStorage.setItem("adminToken", tokenInput);
  };

  const allBudgetRows: BudgetRow[] = [
    {
      label: "Total allocated",
      allocated: totalAllocated,
      cap: TOTAL_CAP,
    },
    ...DEPARTMENTS.map((d) => ({
      label: d.label,
      allocated: allocatedByDept[d.value],
      cap: DEPARTMENT_CAPS[d.value],
    })),
  ];

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Summer Special Projects — Dashboard
            </h1>
            <p className="text-muted-foreground">
              Review proposals and adjust hours against each department's
              summer budget.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">Open survey form</Button>
          </Link>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin access</CardTitle>
            <CardDescription>
              Enter the admin token to adjust hours. Stored locally in this
              browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[240px]">
              <Label htmlFor="token">Admin token</Label>
              <Input
                id="token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="paste admin token"
              />
            </div>
            <Button onClick={saveToken}>Save token</Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/60 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({submissions.length})
            </TabsTrigger>
            {DEPARTMENTS.map((d) => (
              <TabsTrigger key={d.value} value={d.value}>
                {d.label} (
                {submissions.filter((s) => s.department === d.value).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <BudgetCards rows={allBudgetRows} />
            <Card>
              <CardHeader>
                <CardTitle>All submissions</CardTitle>
                <CardDescription>
                  Hour adjustments save immediately and recalculate per-dept
                  totals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : (
                  <SubmissionsTable
                    rows={submissions}
                    showDepartment
                    onChangeHours={handleChange}
                    savingId={savingId}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {DEPARTMENTS.map((d) => {
            const deptRows = submissions.filter((s) => s.department === d.value);
            const deptBudget: BudgetRow[] = [
              {
                label: `${d.label} allocated`,
                allocated: allocatedByDept[d.value],
                cap: DEPARTMENT_CAPS[d.value],
              },
            ];
            return (
              <TabsContent key={d.value} value={d.value} className="space-y-6">
                <BudgetCards rows={deptBudget} />
                <Card>
                  <CardHeader>
                    <CardTitle>{d.label} submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <SubmissionsTable
                        rows={deptRows}
                        showDepartment={false}
                        onChangeHours={handleChange}
                        savingId={savingId}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </main>
  );
}
