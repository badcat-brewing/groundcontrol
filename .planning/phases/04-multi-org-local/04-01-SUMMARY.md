# Plan 04-01 Implementation Summary

## Objective
Add GITHUB_ORGS env var support so the scanner fetches repos from multiple GitHub organizations alongside the user's personal repos. Verify local-only project discovery works through the UI scan path.

## Changes Made

### 1. Scanner Multi-Org Support (scanner/index.ts, scanner/github.ts)

**scanner/github.ts:**
- Added `owner` field to `PartialProject` interface to track which owner (user or org) each repo belongs to
- Updated `transformRepoData()` to accept and set the `owner` parameter

**scanner/index.ts:**
- Added `orgs?: string[]` field to `ScanOptions` interface
- Rewrote `runScan()` repo fetching to support multiple sources:
  - Fetches user repos first (unless in legacy single-org mode)
  - Iterates over all orgs and fetches their repos
  - Deduplicates by prefixing org repos as `org/reponame`
  - Uses `repo.owner` for correct GitHub API calls per repo
  - Extracts base repo name for local path matching and API calls
- Updated local-only discovery to match against both prefixed and base repo names
- In `main()`: parses `GITHUB_ORGS` env var (comma-separated, trimmed, empty-filtered)
- Merges `--org` CLI flag into orgs array when both are provided
- Preserves legacy `--org` behavior when `GITHUB_ORGS` is not set

### 2. API Route GITHUB_ORGS Support (src/app/api/scan/route.ts)
- Reads and parses `GITHUB_ORGS` env var (same logic as CLI)
- Passes `orgs` array to `runScan()` call

### 3. Local-Only Discovery Verification
- Confirmed the existing code path is complete: API route passes `localDir` to `runScan`, which calls `discoverLocalDirs` to find local-only projects
- No gaps found in the UI scan path for local-only discovery

### 4. Test Updates (scanner/__tests__/github.test.ts)
- Updated `transformRepoData` calls to pass required `owner` parameter
- Added assertion for `owner` field in test output

## Behavior Summary

| Scenario | User Repos | Org Repos | Repo Naming |
|---|---|---|---|
| No orgs, no --org | Fetched | None | `reponame` |
| --org only (no GITHUB_ORGS) | Skipped | Single org | `reponame` (legacy) |
| GITHUB_ORGS=org1 | Fetched | org1 | User: `reponame`, Org: `org1/reponame` |
| GITHUB_ORGS=org1,org2 | Fetched | org1 + org2 | User: `reponame`, Org: `orgN/reponame` |
| GITHUB_ORGS=org1 + --org org2 | Fetched | org1 + org2 | Prefixed for both orgs |
| GITHUB_ORGS="" | Fetched | None | `reponame` (empty string is falsy) |

## Verification
- All 32 tests passing (`npx vitest run`)
- `npm run build` succeeds with no errors
- GITHUB_ORGS="" handled gracefully (falsy, treated as unset)
- GITHUB_ORGS with single org works (fetches user + org repos)
- GITHUB_ORGS with multiple orgs works (fetches user + all org repos, deduped)
- --org CLI flag works independently (legacy single-org mode preserved)
- Local-only discovery confirmed working through UI scan path

## Files Changed
- scanner/github.ts (added `owner` field to PartialProject, updated transformRepoData signature)
- scanner/index.ts (added `orgs` to ScanOptions, multi-org fetch logic, GITHUB_ORGS parsing)
- scanner/__tests__/github.test.ts (updated test calls for new signature)
- src/app/api/scan/route.ts (GITHUB_ORGS parsing, pass orgs to runScan)
- .planning/phases/04-multi-org-local/04-01-SUMMARY.md (created)
