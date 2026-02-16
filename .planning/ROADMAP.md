# Roadmap — Remote Repo Visibility

**Brief:** @.planning/BRIEF.md
**Branch:** `feat/remote-repo-visibility`
**Milestone:** v1.1

---

## Phase 01 — Scanner: Source Classification & Enhanced Remote Data

**Goal:** Add `source` field to manifest, enrich remote-only repos with more GitHub metadata, compute local-vs-remote diff for synced repos.

**Scope:**
- Add `source: "local-only" | "remote-only" | "synced"` to `ProjectManifest` type
- Fetch additional GitHub API data: languages, topics, license, repo size, visibility (public/private)
- For synced repos: compare local HEAD vs remote default branch (ahead/behind counts, branch divergence)
- Update manifest schema and scanner output
- Unit tests for new scanner logic

**Plans:**
- `01-01-PLAN.md` — Types & enhanced GitHub fetching (2 tasks, autonomous)
- `01-02-PLAN.md` — Source classification, diff module, tests (3 tasks, autonomous)

---

## Phase 02 — Dashboard: Source Visibility & Filtering

**Goal:** Surface source type and diff data throughout the dashboard UI.

**Scope:**
- Source badge component (local-only / remote-only / synced)
- Filter by source type in project table
- Summary cards updated with source breakdown
- Project detail page: show remote-specific metadata (languages, topics, license, visibility)
- Project detail page: show local-vs-remote diff summary for synced repos

**Plans:**
- `02-01-PLAN.md` — SourceBadge component & table updates (2 tasks, autonomous)
- `02-02-PLAN.md` — SummaryCards source row & ProjectDetail metadata/diff (2 tasks, autonomous)

---

## Phase 03 — Polish & Verification

**Goal:** Edge case handling, backward compatibility, end-to-end verification.

**Scope:**
- Handle edge cases (archived repos, empty repos, rate limiting)
- Progress feedback for enhanced scan
- Backward-compatible dashboard rendering for old manifests
- End-to-end verification with real scan data

**Plans:**
- `03-01-PLAN.md` — Edge cases, backward compat, e2e verify (2 auto tasks + 1 human-verify checkpoint)

---

## Status Tracking

| Phase | Plan | Status | Tasks |
|-------|------|--------|-------|
| 01 — Scanner | 01-01 Types & GitHub fetching | pending | 2 auto |
| 01 — Scanner | 01-02 Source classification & tests | pending | 3 auto |
| 02 — Dashboard | 02-01 SourceBadge & table | pending | 2 auto |
| 02 — Dashboard | 02-02 SummaryCards & detail | pending | 2 auto |
| 03 — Polish | 03-01 Edge cases & verify | pending | 2 auto + 1 checkpoint |
