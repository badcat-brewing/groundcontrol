# Project PM Design System

## Direction
Mission control for a developer's project portfolio. Dense, scannable, utilitarian. Terminal that learned visual hierarchy.

## Palette
- **Nav**: slate-900 bg, white text
- **Canvas**: slate-50 (via --background: #f8fafc)
- **Surface**: white cards, border-slate-200
- **Accent**: sky-500 (all interactive elements — links, buttons, focus)
- **Status**: emerald (active), sky (recent), amber (stale), rose (abandoned), violet (paused)
- **Text**: slate-900 primary, slate-500 secondary, slate-400 tertiary

## Depth
Borders-only. No shadows. `border border-slate-200` on all cards.

## Surfaces
- Page: slate-50
- Cards: white with slate-200 border
- Inputs: bg-slate-50 (inset feel)
- Table rows: even:bg-slate-50/30, hover:bg-sky-50/50

## Typography
- **UI**: Geist Sans (font-sans)
- **Data**: Geist Mono (font-mono) — numbers, dates, counts, paths, metrics
- **Headlines**: font-semibold tracking-tight
- **Section labels**: text-xs font-medium uppercase tracking-wider text-slate-400
- **Tabular numbers**: font-variant-numeric: tabular-nums on .font-mono

## Spacing
- Base: 4px
- Card padding: p-5
- Section gaps: space-y-6
- Metric gaps: gap-4
- Tag gaps: gap-1.5

## Signature: Pulse Dots
Status encoded as small colored circles:
- Active: filled emerald-400
- Recent: filled sky-400
- Stale: filled amber-400
- Abandoned: hollow ring (border rose-400, bg-transparent)
- Paused: filled violet-400

## Component Patterns

### StatusBadge
Dot (h-2 w-2 rounded-full) + text label. Not a pill badge.

### SummaryCards
Horizontal inline metric bar. Dot + label + monospace number. Single bottom border.

### Tag chips
- Default: bg-slate-100 text-slate-600 font-mono text-[11px]
- Tech stack: bg-slate-100 text-indigo-600
- Capabilities: bg-slate-100 text-teal-600
- User tags: bg-slate-100 text-slate-600

### Inputs
bg-slate-50 border-slate-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-400

### Buttons
Primary: bg-sky-500 hover:bg-sky-400 text-white
