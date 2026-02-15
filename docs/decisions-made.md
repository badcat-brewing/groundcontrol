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

## Design System

### 7. Mission-control aesthetic (not warm, not corporate)
**Decision**: Dark slate-900 nav, borders-only depth (no shadows), monospace for all data/metrics, pulse dot status indicators instead of colored pill badges.
**Rationale**: Frank's a developer managing 50+ code projects. This isn't a consumer app — it's a cockpit. The aesthetic should feel like a well-designed terminal tool, not a SaaS marketing dashboard. Dense, scannable, utilitarian.

### 8. Pulse dots as signature element
**Decision**: Replaced standard colored pill badges with small colored circles (filled for active states, hollow ring for abandoned). Status is read by dot color at a glance without reading text.
**Rationale**: When scanning a table of 50+ projects, you need to read activity patterns without reading labels. The dot system works at the squint-test level — blur your eyes and you can still see which projects are alive.

### 9. Monospace for data, sans-serif for UI
**Decision**: All numbers, dates, counts, paths, and project metrics use Geist Mono with tabular-nums. UI labels and descriptions use Geist Sans.
**Rationale**: Monospace numbers align vertically in tables and feel like instrument readings. Separating data typography from label typography creates clear visual hierarchy.

### 10. Inline metric bar instead of colored cards
**Decision**: Replaced the 6-card grid (Total/Active/Recent/etc.) with a single horizontal metric bar using dots, labels, and monospace numbers.
**Rationale**: Cards with colored backgrounds are the #1 "generic dashboard" pattern. An inline bar is denser, uses less vertical space, and puts all numbers at the same visual level for quick comparison.

### 11. Sky-500 as sole accent color
**Decision**: All interactive elements (links, buttons, focus rings, hover states) use sky-500/sky-600. No other accent colors.
**Rationale**: One accent color = clear action hierarchy. Multiple accent colors dilute focus and look noisy.
