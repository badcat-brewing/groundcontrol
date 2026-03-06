# Plan 01-02 Implementation Summary

## Objective
Wire up source classification in the scanner orchestrator, implement local-vs-remote diff for synced repos, and add unit tests for the new logic.

## Changes Made

### 1. Created Diff Module (scanner/diff.ts)
- Implemented `computeLocalRemoteDiff()` function
- Safely executes git commands using `execFileSync` with error handling
- Features:
  - Gets current local branch name
  - Fetches latest remote state
  - Computes ahead/behind commit counts
  - Detects uncommitted changes
  - Compares local vs remote branches
  - Gracefully handles errors (no remote, command failures)
  - Returns sensible defaults on failure

### 2. Enhanced GitHub Fetching (scanner/github.ts)
- Added `fetchBranchNames()` function to retrieve branch names from GitHub API
- Extended `PartialProject` interface with `branchNames: string[]` field
- Updated `transformRepoData()` to initialize empty branchNames array
- Modified `fetchAllRepos()` loop to:
  - Call `fetchBranchNames()` to get branch names and count
  - Populate `branchNames` field for diff computation

### 3. Updated Scanner Orchestrator (scanner/index.ts)
- Imported `computeLocalRemoteDiff` from diff module
- Implemented source classification logic:
  - `localPath && githubUrl` → `'synced'`
  - `localPath && !githubUrl` → `'local-only'`
  - `!localPath` → `'remote-only'`
- For synced repos: calls `computeLocalRemoteDiff()` with branch names and default branch
- Populates all new fields (source, visibility, languages, topics, license, sizeKB, isArchived, isFork, diff)

### 4. Added Test Coverage
- **scanner/__tests__/diff.test.ts** (4 tests):
  - Normal synced repo with ahead/behind commits
  - Uncommitted changes detection
  - Graceful handling of fetch failures
  - Safe defaults on git command failures

- **scanner/__tests__/source.test.ts** (4 tests):
  - Source classification for synced repos
  - Source classification for remote-only repos
  - Source classification for local-only repos
  - Edge case handling

## Verification
- ✅ `npx tsc --noEmit` passes with no errors
- ✅ `npx vitest run` passes all 32 tests across 7 test files
- ✅ Scanner classifies all projects by source type
- ✅ Diff computation handles error cases gracefully
- ✅ All new functionality has unit test coverage

## Files Changed
- scanner/diff.ts (new)
- scanner/github.ts
- scanner/index.ts
- scanner/__tests__/diff.test.ts (new)
- scanner/__tests__/source.test.ts (new)
- scanner/__tests__/github.test.ts

## Next Steps
Phase 02 will implement the dashboard UI components to display source badges and enhanced metadata.
