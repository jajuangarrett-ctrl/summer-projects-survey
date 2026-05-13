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
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteSubmission, fetchSubmissions, updateHours } from "@/lib/api";
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
  onDelete,
  savingId,
  deletingId,
}: {
  rows: Submission[];
  showDepartment: boolean;
  onChangeHours: (id: string, v: string) => void;
  onDelete: (s: Submission) => void;
  savingId: string | null;
  deletingId: string | null;
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
            <th className="py-2 pl-3 font-medium text-right">
              <span className="sr-only">Actions</span>
            </th>
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
              <td className="py-3 pl-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete submission from ${s.counselorName}`}
                  disabled={deletingId === s.id}
                  onClick={() => onDelete(s)}
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
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
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("all");

  const load = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSubmissions(token);
      setSubmissions(list);
      return true;
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 401) {
        setAuthed(false);
        setAdminToken("");
        localStorage.removeItem("adminToken");
        return false;
      }
      setError(e instanceof Error ? e.message : "Failed to load");
      return true;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!adminToken) {
        setAuthChecking(false);
        return;
      }
      const ok = await load(adminToken);
      setAuthed(ok);
      setAuthChecking(false);
    })();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setSignInError(null);
    try {
      const list = await fetchSubmissions(tokenInput);
      setSubmissions(list);
      setAdminToken(tokenInput);
      localStorage.setItem("adminToken", tokenInput);
      setAuthed(true);
      setTokenInput("");
    } catch (e) {
      const status = (e as { status?: number }).status;
      setSignInError(
        status === 401
          ? "Incorrect password."
          : e instanceof Error
            ? e.message
            : "Sign-in failed",
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = () => {
    setAuthed(false);
    setAdminToken("");
    setSubmissions([]);
    localStorage.removeItem("adminToken");
  };

  const allocatedByDept = useMemo(() => {
    const out: Record<Department, number> = { calworks: 0, sss: 0 };
    for (const s of submissions) {
      out[s.department] = (out[s.department] ?? 0) + totalHours(s.hoursPerWeek);
    }
    return out;
  }, [submissions]);

  const totalAllocated = allocatedByDept.calworks + allocatedByDept.sss;

  const handleChange = async (id: string, value: string) => {
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

  const handleDelete = async (s: Submission) => {
    const ok = window.confirm(
      `Delete the proposal "${s.projectTitle}" from ${s.counselorName}? This commits a removal to the repo and cannot be undone from the dashboard.`,
    );
    if (!ok) return;
    setDeletingId(s.id);
    setError(null);
    const prev = submissions;
    setSubmissions((list) => list.filter((x) => x.id !== s.id));
    try {
      await deleteSubmission(s.id, adminToken);
    } catch (e) {
      setSubmissions(prev);
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
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

  if (authChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dashboard sign-in</CardTitle>
            <CardDescription>
              This dashboard is restricted. Enter the dashboard password to
              view and manage submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              {signInError && (
                <p className="text-sm text-destructive" role="alert">
                  {signInError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={signingIn || !tokenInput}
              >
                {signingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <Link to="/" className="underline">
                  Back to the survey form
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => load(adminToken)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
            <Link to="/">
              <Button variant="outline">Survey form</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>

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
                    onDelete={handleDelete}
                    savingId={savingId}
                    deletingId={deletingId}
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
                        onDelete={handleDelete}
                        savingId={savingId}
                        deletingId={deletingId}
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
