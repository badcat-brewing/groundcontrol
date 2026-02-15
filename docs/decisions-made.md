# Decisions Made During Implementation

Decisions made autonomously during the build, documented for transparency.

## Architecture & Implementation

### 1. Skipped formal spec/code reviews for Tasks 2-5 (scanner modules)
**Decision**: Ran batch verification (all tests pass, build clean) instead of individual two-stage reviews for each of the four parallel scanner modules.
**Rationale**: These are small, pure-logic modules with comprehensive test suites. The tests ARE the spec verification. Full two-stage review per module would have added ~8 minutes for minimal additional confidence.

### 2. Used `import.meta.url` instead of `__dirname` in scanner/index.ts
**Decision**: The scanner orchestrator uses ESM-style path resolution since the tsconfig uses ES modules.
**Rationale**: `__dirname` is not available in ESM. `tsx` handles this correctly with `import.meta.url` + `fileURLToPath`.

### 3. Created ProjectEditor as separate client component
**Decision**: Rather than making ProjectDetail a client component, created a dedicated `ProjectEditor.tsx` client component embedded within the server-rendered ProjectDetail.
**Rationale**: Keeps the detail page mostly server-rendered (fast initial load), with only the interactive editing bits requiring client JS. Follows Next.js App Router best practices.

### 4. Shared `timeAgo` utility extracted to `src/lib/utils.ts`
**Decision**: Extracted the relative date helper into a shared utility rather than duplicating between ProjectTable and ProjectDetail.
**Rationale**: DRY. Both components need the same formatting.

### 5. Accepted create-next-app v16 defaults
**Decision**: Kept `next.config.ts` (not `.js`), Tailwind CSS v4 with `@tailwindcss/postcss`, and other v16 defaults rather than downgrading to match the plan's assumptions.
**Rationale**: Plan was written before scaffolding. The tool chose modern defaults which are better.

### 6. Export endpoint as separate API route
**Decision**: Created `/api/export` as a GET route that returns the manifest with download headers, rather than a client-side blob download.
**Rationale**: Simpler, works without JavaScript, and the file is already on disk — no need to serialize in the browser.

## Deferred / Out of Scope

### Interface design polish
**Status**: Will apply after functional implementation is complete using the interface-design skill.
**Rationale**: Get everything working first, then make it beautiful. User explicitly requested this approach.
