import type { Submission, HoursPerWeek } from "@/lib/utils";

const BASE = "/api";

export async function fetchSubmissions(): Promise<Submission[]> {
  const r = await fetch(`${BASE}/get-submissions`);
  if (!r.ok) throw new Error(`Failed to load submissions (${r.status})`);
  const data = await r.json();
  return data.submissions ?? [];
}

export async function createSubmission(
  body: Omit<Submission, "id" | "timestamp">,
): Promise<Submission> {
  const r = await fetch(`${BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Submit failed (${r.status})`);
  return r.json();
}

export async function updateHours(
  id: string,
  hoursPerWeek: HoursPerWeek,
  adminToken: string,
): Promise<Submission> {
  const r = await fetch(`${BASE}/update-hours`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({ id, hoursPerWeek }),
  });
  if (!r.ok) throw new Error(`Update failed (${r.status})`);
  return r.json();
}

export async function deleteSubmission(
  id: string,
  adminToken: string,
): Promise<void> {
  const r = await fetch(`${BASE}/delete-submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({ id }),
  });
  if (!r.ok) throw new Error(`Delete failed (${r.status})`);
}
