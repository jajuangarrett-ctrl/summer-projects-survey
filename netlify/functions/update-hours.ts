import type { Handler } from "@netlify/functions";
import {
  errorResponse,
  jsonResponse,
  readSubmissions,
  requireAdmin,
  writeSubmissions,
} from "./_github";

const allowedHpw = new Set([3, 4, 5]);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    requireAdmin(event.headers as Record<string, string | undefined>);
    const body = JSON.parse(event.body ?? "{}");
    const id = String(body.id ?? "");
    const hpw = Number(body.hoursPerWeek);
    if (!id) return jsonResponse(400, { error: "Missing id" });
    if (!allowedHpw.has(hpw)) {
      return jsonResponse(400, {
        error: "hoursPerWeek must be 3, 4, or 5",
      });
    }
    const { submissions, sha } = await readSubmissions();
    const idx = submissions.findIndex((s) => s.id === id);
    if (idx === -1) return jsonResponse(404, { error: "Not found" });
    submissions[idx] = {
      ...submissions[idx],
      hoursPerWeek: hpw as 3 | 4 | 5,
    };
    await writeSubmissions(
      submissions,
      sha,
      `dashboard: adjust hours for ${submissions[idx].counselorName} to ${hpw}/wk`,
    );
    return jsonResponse(200, submissions[idx]);
  } catch (err) {
    return errorResponse(err);
  }
};
