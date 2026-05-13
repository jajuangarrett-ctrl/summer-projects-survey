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
import { AlertTriangle, Loader2 } from "lucide-react";
import { fetchSubmissions, updateHours } from "@/lib/api";
import {
  HOUR_CAP,
  totalHours,
  type HoursPerWeek,
  type Submission,
} from "@/lib/utils";

export function DashboardPage() {
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem("adminToken") ?? "",
  );
  const [tokenInput, setTokenInput] = useState(adminToken);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const allocated = useMemo(
    () => submissions.reduce((sum, s) => sum + totalHours(s.hoursPerWeek), 0),
    [submissions],
  );
  const remaining = HOUR_CAP - allocated;
  const overBudget = remaining < 0;
  const nearCap = !overBudget && remaining <= 15;

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

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Summer Special Projects — Dashboard
            </h1>
            <p className="text-muted-foreground">
              Review proposals and adjust hour allocations against the 110-hour
              summer budget.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">Open survey form</Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Hours allocated</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {allocated}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
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
                Remaining (of {HOUR_CAP})
              </CardDescription>
              <CardTitle
                className={`text-3xl tabular-nums ${
                  overBudget ? "text-destructive" : ""
                }`}
              >
                {remaining}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submissions</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {submissions.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              Hour adjustments save immediately and recalculate totals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Submitted</th>
                      <th className="py-2 pr-3 font-medium">Counselor</th>
                      <th className="py-2 pr-3 font-medium">Project</th>
                      <th className="py-2 pr-3 font-medium">Extends AY</th>
                      <th className="py-2 pr-3 font-medium">Hrs/wk</th>
                      <th className="py-2 pr-3 font-medium text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b align-top">
                        <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                          {new Date(s.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-3 font-medium">
                          {s.counselorName}
                        </td>
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
                              onValueChange={(v) => handleChange(s.id, v)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
