# Summer Special Projects — Survey & Dashboard

Internal tool for collecting and allocating Summer 2026 non-classroom assignment hours. Counselors submit a proposal through a survey; the dean's office reviews and adjusts hours per week against a 110-hour summer budget.

Built with **TypeScript + Vite + React + Tailwind + shadcn/ui**, deployed to **Netlify**. Submissions are persisted as JSON in this repository at `data/submissions.json` via the GitHub Contents API — same pattern as the policy and hiring dashboards, just GitHub-backed instead of Notion/SQLite.

## Routes

- `/` — Counselor-facing survey form
- `/dashboard` — Admin dashboard (table view, hours-per-week dropdown, running total, remaining of 110)

## Form fields

- Counselor name
- Project title
- Project description
- Measurable outcomes / deliverables
- Will this project extend into the academic year? (toggle)
- If yes — same counselor or to be reassigned
- Hours per week requested (3, 4, or 5)
- Auto-calculated total = hours/week × 10 weeks

## Local development

```bash
npm install
npm run dev
```

Vite dev server runs at `http://localhost:5173`. The dev server proxies `/api/*` to `http://localhost:8888/.netlify/functions/*` — run `netlify dev` in a second terminal to serve the functions locally:

```bash
npx netlify dev
```

You'll need a `.env` file (copy `.env.example`):

```
GITHUB_TOKEN=ghp_xxx_fine_grained_PAT_with_contents_rw
GITHUB_OWNER=jajuangarrett-ctrl
GITHUB_REPO=summer-projects-survey
GITHUB_BRANCH=main
DATA_PATH=data/submissions.json
ADMIN_TOKEN=long-random-string
```

The GitHub PAT needs **Contents: Read and write** on this repo only (use a fine-grained token).

## Netlify deploy

1. `gh repo create` already done — this repo lives at `jajuangarrett-ctrl/summer-projects-survey`.
2. In Netlify, **Add new site → Import an existing project → GitHub** and pick `summer-projects-survey`.
3. Netlify auto-detects `netlify.toml` (build command `npm run build`, publish `dist`, functions `netlify/functions`).
4. Set the environment variables above under **Site configuration → Environment variables**.
5. Deploy.

## Data persistence

Each submission is committed to `data/submissions.json` with a commit message like `survey: add submission from <name>`. Hour adjustments from the dashboard commit as `dashboard: adjust hours for <name> to <n>/wk`. Git history is the audit log.

## API

| Route | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/get-submissions` | GET | none | List submissions (newest first) |
| `/api/submit` | POST | none | Append a new submission |
| `/api/update-hours` | POST | `x-admin-token` header | Change `hoursPerWeek` for a submission |
