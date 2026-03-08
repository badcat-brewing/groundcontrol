# Roadmap: Ground Control

**Brief:** @.planning/BRIEF.md
**Branch:** `feat/remote-repo-visibility` (v1.1), `feat/cli-ui-parity` (v1.2)

---

## Milestones

- ✅ **v1.1 Remote Repo Visibility** - Phases 01-03 (shipped)
- 🚧 **v1.2 CLI + UI Feature Parity** - Phases 04-06

## Phases

<details>
<summary>✅ v1.1 Remote Repo Visibility (Phases 01-03) - SHIPPED</summary>

### Phase 01 — Scanner: Source Classification & Enhanced Remote Data

**Goal:** Add `source` field to manifest, enrich remote-only repos with more GitHub metadata, compute local-vs-remote diff for synced repos.

Plans:
- [x] 01-01: Types & enhanced GitHub fetching
- [x] 01-02: Source classification, diff module, tests

### Phase 02 — Dashboard: Source Visibility & Filtering

**Goal:** Surface source type and diff data throughout the dashboard UI.

Plans:
- [x] 02-01: SourceBadge component & table updates
- [x] 02-02: SummaryCards source row & ProjectDetail metadata/diff

### Phase 03 — Polish & Verification

**Goal:** Edge case handling, backward compatibility, end-to-end verification.

Plans:
- [x] 03-01: Edge cases, backward compat, e2e verify

</details>

### 🚧 v1.2 CLI + UI Feature Parity

**Milestone Goal:** Make CLI and UI feature-complete — CLI gets sync, overlaps, export, overrides commands; UI gets multi-org scanning and local-only discovery.

#### Phase 04 — Multi-Org & Local Discovery
**Goal:** Add `GITHUB_ORGS` env var for scanning multiple orgs, verify local-only discovery works through UI scan path.
**Depends on:** Phase 03

Plans:
- [x] 04-01: GITHUB_ORGS support in scanner & API route (2 tasks, autonomous)

#### Phase 05 — CLI Subcommand Framework
**Goal:** Create `pm` CLI entry point with subcommand routing; implement scan, export, overlaps commands.
**Depends on:** Phase 04

Plans:
- [x] 05-01: CLI entry point & scan/export/overlaps commands (3 tasks, autonomous)

#### Phase 06 — CLI Sync & Overrides
**Goal:** Add sync and overrides CLI commands with tests.
**Depends on:** Phase 05

Plans:
- [x] 06-01: sync & overrides commands + tests (3 tasks, autonomous)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 01 — Scanner Source | v1.1 | 2/2 | Complete | - |
| 02 — Dashboard Source | v1.1 | 2/2 | Complete | - |
| 03 — Polish | v1.1 | 1/1 | Complete | - |
| 04 — Multi-Org & Local Discovery | v1.2 | 1/1 | Complete | 2026-03-08 |
| 05 — CLI Subcommand Framework | v1.2 | 1/1 | Complete | 2026-03-08 |
| 06 — CLI Sync & Overrides | v1.2 | 1/1 | Complete | 2026-03-08 |
