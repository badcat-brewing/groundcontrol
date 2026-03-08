# Plan 06-01 Implementation Summary

## Objective
Add sync and overrides CLI commands so all UI-only features are accessible from the terminal. Add CLI tests. Achieve full CLI + UI feature parity.

## Changes Made

### 1. Shared Sync Module (scanner/sync.ts)
- Created `scanner/sync.ts` with reusable sync logic extracted from `src/app/api/sync/route.ts`
- Exports: `cloneRepo`, `pullRepo`, `isCleanWorkingTree`, `validateSyncAction`, `buildWorkList`
- Functions accept a `SyncLogger` callback instead of SSE writer, return `SyncResult` objects
- Uses `execFileSync` for git clone (prevents command injection), `execSync` for pull (safe, no user input in command)

### 2. Sync CLI Command (scanner/cli.ts — handleSync)
- `npm run pm sync` runs both clone and pull (default action: "both")
- `npm run pm sync -- clone` clones only missing repos
- `npm run pm sync -- pull` pulls only existing repos
- Validates action argument, requires LOCAL_PROJECTS_DIR env var and manifest
- Prints progress per repo and summary table at end with repo name, action, and result

### 3. API Route Refactored (src/app/api/sync/route.ts)
- Refactored to import `cloneRepo`, `pullRepo`, `validateSyncAction`, `buildWorkList` from `scanner/sync.ts`
- Collects sync logs from synchronous functions and replays as SSE events
- No duplication of git clone/pull logic between CLI and API

### 4. Shared Overrides Module (scanner/overrides.ts)
- Created `scanner/overrides.ts` consolidating overrides logic from `scanner/index.ts` and `src/app/api/overrides/route.ts`
- Exports: `loadOverrides`, `saveOverrides`, `updateOverride`
- `updateOverride` merges updates into existing project overrides and persists

### 5. Overrides CLI Commands (scanner/cli.ts — handleOverrides)
- `npm run pm overrides -- list` prints formatted table (project, status, tags, notes preview)
- `npm run pm overrides -- set <project> [--tag <tag>] [--status <status>] [--notes <text>]`
  - `--tag` can be repeated for multiple tags
  - Status validated against: active, recent, stale, abandoned, paused
  - Updates persisted to `data/overrides.json`

### 6. Consumers Updated
- `scanner/index.ts` now imports `loadOverrides` from `scanner/overrides.ts` (removed inline implementation)
- `src/app/api/overrides/route.ts` now imports `updateOverride` from `scanner/overrides.ts` (removed inline implementation)

### 7. CLI Tests (scanner/__tests__/cli.test.ts)
- 17 tests covering:
  - Sync action validation (valid/invalid actions)
  - Work list building (clone-only, pull-only, both, empty list)
  - Overrides set flag parsing (all flags, single tag, status only, notes only, empty args)
  - Overrides module (loadOverrides error handling, JSON parsing, saveOverrides, updateOverride merge, new project creation)

## Verification
- All 49 tests passing (`npx vitest run`)
- `npm run build` succeeds with no errors
- `npm run pm sync` works end-to-end (processed 94 repos)
- `npm run pm sync -- clone` works (clone-only mode)
- `npm run pm overrides -- list` shows formatted table (or "No overrides set.")
- `npm run pm overrides -- set` updates overrides.json correctly
- API routes still work after refactoring to shared modules
- No code duplication between CLI and API routes for sync/overrides logic

## Files Changed
- scanner/sync.ts (created — shared sync logic)
- scanner/overrides.ts (created — shared overrides logic)
- scanner/cli.ts (updated — added sync and overrides handlers, updated help text)
- scanner/index.ts (updated — imports loadOverrides from shared module)
- src/app/api/sync/route.ts (updated — imports from scanner/sync.ts)
- src/app/api/overrides/route.ts (updated — imports from scanner/overrides.ts)
- scanner/__tests__/cli.test.ts (created — 17 CLI tests)
- data/overrides.json (unchanged — restored to empty state after testing)
