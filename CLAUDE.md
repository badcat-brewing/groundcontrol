# Project PM

GitHub-aware project manager dashboard. Scans all repos for a GitHub user, enriches with local filesystem metadata, and displays a visual dashboard with status tracking and overlap detection.

## Architecture

Monolith Next.js app (App Router) with:
- **Scanner CLI** (`scanner/`) — Node.js script that calls GitHub API + reads local files, outputs `data/manifest.json`
- **Dashboard** (`src/`) — Next.js web UI that reads the manifest and renders overview, detail, and overlap views
- **Overrides** (`data/overrides.json`) — Manual tags, notes, and status overrides persisted across scans

## Key Commands

- `npm run scan` — Run the scanner (requires GITHUB_TOKEN and GITHUB_USERNAME env vars)
- `npm run dev` — Start the dashboard at localhost:3000
- `npm run build` — Production build
- `npx vitest run` — Run all tests

## Project Structure

- `scanner/` — CLI scanner modules (github, local, extractor, status, types)
- `scanner/__tests__/` — Scanner unit tests
- `src/app/` — Next.js pages (overview, project detail, overlaps, API routes)
- `src/components/` — React components (table, cards, badges, editor, nav)
- `src/lib/` — Shared utilities (manifest reader, overlap logic, helpers)
- `data/` — Generated manifest and manual overrides

## Environment Variables

- `GITHUB_TOKEN` — GitHub personal access token (required for scan)
- `GITHUB_USERNAME` — GitHub username to scan repos for (required for scan)
- `LOCAL_PROJECTS_DIR` — Path to local projects directory for filesystem enrichment (optional)

## Tech Stack

Next.js 16, Tailwind CSS v4, TypeScript, Octokit, Vitest
