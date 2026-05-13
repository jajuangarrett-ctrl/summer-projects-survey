// Shared helpers for reading/writing data/submissions.json via GitHub Contents API.

const GH_API = "https://api.github.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function envOptional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

const OWNER = () => env("GITHUB_OWNER");
const REPO = () => env("GITHUB_REPO");
const BRANCH = () => envOptional("GITHUB_BRANCH", "main");
const DATA_PATH = () => envOptional("DATA_PATH", "data/submissions.json");
const TOKEN = () => env("GITHUB_TOKEN");

export type Department = "calworks" | "sss";

export interface Submission {
  id: string;
  timestamp: string;
  department: Department;
  counselorName: string;
  projectTitle: string;
  projectDescription: string;
  measurableOutcomes: string;
  extendsAcademicYear: boolean;
  continuedBy?: "same" | "reassigned" | null;
  hoursPerWeek: 3 | 4 | 5;
}

interface FileResponse {
  content: string;
  sha: string;
}

const headers = () => ({
  Authorization: `Bearer ${TOKEN()}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

export async function readSubmissions(): Promise<{
  submissions: Submission[];
  sha: string | null;
}> {
  const url = `${GH_API}/repos/${OWNER()}/${REPO()}/contents/${encodeURIComponent(
    DATA_PATH(),
  )}?ref=${encodeURIComponent(BRANCH())}`;
  const r = await fetch(url, { headers: headers() });
  if (r.status === 404) return { submissions: [], sha: null };
  if (!r.ok) {
    throw new Error(`GitHub read failed: ${r.status} ${await r.text()}`);
  }
  const data = (await r.json()) as FileResponse;
  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as { submissions: Submission[] };
  return { submissions: parsed.submissions ?? [], sha: data.sha };
}

export async function writeSubmissions(
  submissions: Submission[],
  sha: string | null,
  message: string,
): Promise<void> {
  const url = `${GH_API}/repos/${OWNER()}/${REPO()}/contents/${encodeURIComponent(
    DATA_PATH(),
  )}`;
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(
      JSON.stringify({ submissions }, null, 2),
      "utf8",
    ).toString("base64"),
    branch: BRANCH(),
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    throw new Error(`GitHub write failed: ${r.status} ${await r.text()}`);
  }
}

export function requireAdmin(headersIn: Record<string, string | undefined>) {
  const want = env("ADMIN_TOKEN");
  const got = headersIn["x-admin-token"] ?? headersIn["X-Admin-Token"];
  if (got !== want) {
    const err = new Error("Unauthorized") as Error & { statusCode?: number };
    err.statusCode = 401;
    throw err;
  }
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function errorResponse(err: unknown) {
  const e = err as Error & { statusCode?: number };
  const status = e.statusCode ?? 500;
  return jsonResponse(status, { error: e.message ?? "Server error" });
}
