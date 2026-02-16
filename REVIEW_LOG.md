# Review Log

This document tracks all code reviews performed by the Reviewer agent during the remote-repo-visibility feature development.

---

## Plan 01-01: Types & Enhanced GitHub Fetching
**Reviewed**: 2026-02-16
**Status**: ✅ Approved

### Summary
Clean implementation of type system extensions and enhanced GitHub API fetching. All plan requirements met with proper error handling and type safety.

### Findings

**Code Quality:**
- ✅ All types correctly defined and exported
- ✅ Proper error handling in `fetchRepoLanguages()` with `{}` fallback
- ✅ Efficient parallel API calls (languages + branches + pulls + commits)
- ✅ Smart visibility fallback: `repo.visibility || (repo.private ? 'private' : 'public')`

**Security:**
- ✅ No injection vulnerabilities in this plan
- ✅ Safe API response handling with proper typing
- ✅ Octokit configured with silent logging (no token leakage)

**Edge Cases:**
- ✅ Empty repos handled (null `pushed_at`, empty `topics`)
- ✅ Missing license handled with optional chaining
- ✅ API failures gracefully caught with `.catch(() => 0)` and `.catch(() => {})`

**Test Coverage:**
- ✅ Happy path tested in `github.test.ts`
- ✅ Null handling tested for empty repos
- ✅ All existing tests updated with new fields (24 tests passing)
- Low priority: Could add tests for private repos, archived/fork flags (acceptable for MVP)

**Plan Compliance:**
- ✅ All Task 1 requirements met
- ✅ All Task 2 requirements met
- ✅ All verification checklist items complete

### Decision Log
None - straightforward implementation with no architectural decisions needed.

---

## Plan 01-02: Source Classification, Diff Module & Tests
**Reviewed**: 2026-02-16
**Status**: ✅ Approved with notes

### Summary
Solid implementation of git diff computation and source classification. Critical security review passed - no command injection vulnerabilities found. Excellent error handling and test coverage.

### Findings

**Code Quality:**
- ✅ `safeExec` wrapper provides excellent error handling pattern
- ✅ Clean separation: diff.ts for git ops, source classification in index.ts
- ✅ Graceful degradation to safe defaults on all failures
- ✅ Type safety maintained throughout
- Low priority: Function marked `async` but doesn't use `await` (diff.ts:13)

**Security (CRITICAL REVIEW):**
- ✅ **COMMAND INJECTION SAFE**: Uses `execFileSync` with array args, not shell execution
- ✅ Branch names passed as literal arguments - special characters cannot execute commands
- ✅ Git `-C` flag prevents directory traversal (localPath validated by existsSync upstream)
- Medium: localPath could benefit from explicit path validation (defense-in-depth, not critical)

**Edge Cases:**
- ✅ Missing remote handled gracefully (returns safe defaults)
- ✅ Deleted directory after lookup handled (all git commands fail safely)
- ✅ Missing default branch on remote handled (rev-list fails, returns 0/0)
- Low priority: fetchBranchNames limited to 100 branches (no pagination)

**Test Coverage:**
- ✅ diff.test.ts: 4 comprehensive tests (happy path, uncommitted, no remote, complete failure)
- ✅ source.test.ts: 4 tests covering all classification scenarios
- ✅ Proper mocking strategy (child_process mocked, no real git execution)
- ✅ All 32 tests passing (up from 24)

**Plan Compliance:**
- ✅ Task 1: computeLocalRemoteDiff implemented per spec (scanner/diff.ts:13-86)
- ✅ Task 2: Source classification + scanner integration complete (scanner/index.ts:94-100)
- ✅ Task 3: Full test coverage for diff and source logic
- ✅ All verification checklist items complete

### Recommended Improvements (non-blocking)
1. Remove `async` keyword from `computeLocalRemoteDiff` for clarity (function is fully synchronous)
2. Add pagination to `fetchBranchNames` for repos with 100+ branches
3. Consider explicit path validation in diff.ts for defense-in-depth

### Decision Log
**Decision**: Use synchronous git commands (execFileSync) instead of async
- Rationale: Scanner is sequential, simpler code, no promise handling needed
- Trade-off: Blocks event loop, but acceptable for CLI tool
- Status: Approved (but should remove misleading `async` keyword)

---

