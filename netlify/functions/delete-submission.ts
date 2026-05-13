import type { Handler } from "@netlify/functions";
import {
  errorResponse,
  jsonResponse,
  readSubmissions,
  requireAdmin,
  writeSubmissions,
} from "./_github";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    requireAdmin(event.headers as Record<string, string | undefined>);
    const body = JSON.parse(event.body ?? "{}");
    const id = String(body.id ?? "");
    if (!id) return jsonResponse(400, { error: "Missing id" });
    const { submissions, sha } = await readSubmissions();
    const target = submissions.find((s) => s.id === id);
    if (!target) return jsonResponse(404, { error: "Not found" });
    const next = submissions.filter((s) => s.id !== id);
    await writeSubmissions(
      next,
      sha,
      `dashboard: delete ${target.department} submission from ${target.counselorName}`,
    );
    return jsonResponse(200, { ok: true });
  } catch (err) {
    return errorResponse(err);
  }
};
