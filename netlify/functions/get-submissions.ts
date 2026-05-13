import type { Handler } from "@netlify/functions";
import {
  errorResponse,
  jsonResponse,
  readSubmissions,
  requireAdmin,
} from "./_github";

export const handler: Handler = async (event) => {
  try {
    requireAdmin(event.headers as Record<string, string | undefined>);
    const { submissions } = await readSubmissions();
    submissions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return jsonResponse(200, { submissions });
  } catch (err) {
    return errorResponse(err);
  }
};
