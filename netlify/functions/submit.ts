import type { Handler } from "@netlify/functions";
import {
  errorResponse,
  jsonResponse,
  readSubmissions,
  writeSubmissions,
  type Submission,
} from "./_github";

const allowedHpw = new Set([3, 4, 5]);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    const body = JSON.parse(event.body ?? "{}");
    const required = [
      "counselorName",
      "projectTitle",
      "projectDescription",
      "measurableOutcomes",
    ] as const;
    for (const f of required) {
      if (!body[f] || typeof body[f] !== "string" || !body[f].trim()) {
        return jsonResponse(400, { error: `Missing field: ${f}` });
      }
    }
    const hpw = Number(body.hoursPerWeek);
    if (!allowedHpw.has(hpw)) {
      return jsonResponse(400, {
        error: "hoursPerWeek must be 3, 4, or 5",
      });
    }
    if (body.department !== "calworks" && body.department !== "sss") {
      return jsonResponse(400, {
        error: "department must be 'calworks' or 'sss'",
      });
    }
    const extendsAcademicYear = Boolean(body.extendsAcademicYear);
    let continuedBy: Submission["continuedBy"] = null;
    if (extendsAcademicYear) {
      if (body.continuedBy !== "same" && body.continuedBy !== "reassigned") {
        return jsonResponse(400, {
          error: "continuedBy must be 'same' or 'reassigned' when extending",
        });
      }
      continuedBy = body.continuedBy;
    }

    const submission: Submission = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
      department: body.department,
      counselorName: String(body.counselorName).trim(),
      projectTitle: String(body.projectTitle).trim(),
      projectDescription: String(body.projectDescription).trim(),
      measurableOutcomes: String(body.measurableOutcomes).trim(),
      extendsAcademicYear,
      continuedBy,
      hoursPerWeek: hpw as 3 | 4 | 5,
    };

    const { submissions, sha } = await readSubmissions();
    submissions.push(submission);
    await writeSubmissions(
      submissions,
      sha,
      `survey: add ${submission.department} submission from ${submission.counselorName}`,
    );

    return jsonResponse(201, submission);
  } catch (err) {
    return errorResponse(err);
  }
};
