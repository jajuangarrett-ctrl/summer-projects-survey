import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2 } from "lucide-react";
import { createSubmission } from "@/lib/api";
import {
  DEPARTMENTS,
  totalHours,
  type Department,
  type HoursPerWeek,
} from "@/lib/utils";

export function SurveyPage() {
  const [department, setDepartment] = useState<Department | "">("");
  const [counselorName, setCounselorName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [measurableOutcomes, setMeasurableOutcomes] = useState("");
  const [extendsAcademicYear, setExtendsAcademicYear] = useState(false);
  const [continuedBy, setContinuedBy] = useState<"same" | "reassigned">("same");
  const [hoursPerWeek, setHoursPerWeek] = useState<HoursPerWeek>(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
      setError("Please select a department.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createSubmission({
        department,
        counselorName: counselorName.trim(),
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        measurableOutcomes: measurableOutcomes.trim(),
        extendsAcademicYear,
        continuedBy: extendsAcademicYear ? continuedBy : null,
        hoursPerWeek,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Project submitted</CardTitle>
            <CardDescription>
              Your summer special project proposal has been received. The dean's
              office will review hour allocations against the 110-hour budget
              and follow up.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setDepartment("");
                setCounselorName("");
                setProjectTitle("");
                setProjectDescription("");
                setMeasurableOutcomes("");
                setExtendsAcademicYear(false);
                setContinuedBy("same");
                setHoursPerWeek(3);
              }}
            >
              Submit another
            </Button>
            <Link to="/dashboard">
              <Button>View dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Summer Special Projects — Proposal Form
          </h1>
          <p className="text-muted-foreground">
            Submit your proposal for Summer 2026 non-classroom assignment hours.
          </p>
        </header>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Program expectations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Summer special projects are intended to support initiatives that
              directly advance program goals and student support efforts.
              Projects must:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Have a clearly defined project with measurable outcomes</li>
              <li>Be selected through a fair and transparent process</li>
              <li>
                Have hours distributed in a manner that best aligns with
                programmatic needs and priorities
              </li>
            </ul>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Proposal details</CardTitle>
              <CardDescription>
                All fields are required unless noted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={department}
                  onValueChange={(v) => setDepartment(v as Department)}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselorName">Counselor name</Label>
                <Input
                  id="counselorName"
                  required
                  value={counselorName}
                  onChange={(e) => setCounselorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project title</Label>
                <Input
                  id="projectTitle"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project description</Label>
                <Textarea
                  id="projectDescription"
                  required
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurableOutcomes">
                  Measurable outcomes / deliverables
                </Label>
                <Textarea
                  id="measurableOutcomes"
                  required
                  rows={4}
                  placeholder="e.g. complete X workshops serving Y students, produce Z deliverable by..."
                  value={measurableOutcomes}
                  onChange={(e) => setMeasurableOutcomes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="extends">
                    Will this project extend into the academic year?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle on if work continues past the 10-week summer period.
                  </p>
                </div>
                <Switch
                  id="extends"
                  checked={extendsAcademicYear}
                  onCheckedChange={setExtendsAcademicYear}
                />
              </div>

              {extendsAcademicYear && (
                <div className="space-y-2 rounded-md border p-3">
                  <Label>If yes — who will continue it?</Label>
                  <RadioGroup
                    value={continuedBy}
                    onValueChange={(v) =>
                      setContinuedBy(v as "same" | "reassigned")
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="same" id="continued-same" />
                      <Label htmlFor="continued-same" className="font-normal">
                        Same counselor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="reassigned"
                        id="continued-reassigned"
                      />
                      <Label
                        htmlFor="continued-reassigned"
                        className="font-normal"
                      >
                        To be reassigned
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-2">
                <Label>Hours per week requested</Label>
                <RadioGroup
                  className="grid grid-cols-3 gap-3"
                  value={String(hoursPerWeek)}
                  onValueChange={(v) =>
                    setHoursPerWeek(Number(v) as HoursPerWeek)
                  }
                >
                  {[3, 4, 5].map((n) => (
                    <Label
                      key={n}
                      htmlFor={`hpw-${n}`}
                      className={`flex items-center justify-center gap-2 rounded-md border p-3 cursor-pointer font-normal ${
                        hoursPerWeek === n
                          ? "border-primary bg-primary/10"
                          : "border-input"
                      }`}
                    >
                      <RadioGroupItem value={String(n)} id={`hpw-${n}`} />
                      <span>{n} hours</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="rounded-md bg-muted/50 p-4 flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Total summer hours (auto-calculated)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hoursPerWeek} hrs/wk × 10 weeks
                  </p>
                </div>
                <span className="text-3xl font-bold tabular-nums">
                  {totalHours(hoursPerWeek)}
                </span>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit proposal"}
              </Button>
            </CardContent>
          </Card>
        </form>

        <footer className="text-center text-xs text-muted-foreground">
          <Link to="/dashboard" className="underline">
            Admin dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
