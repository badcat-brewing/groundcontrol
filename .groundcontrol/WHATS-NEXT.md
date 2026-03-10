# Suggested Next Steps for `groundcontrol`

## 🔍 Add Stale Repo Detection & Re-engagement Prompts
Since the dashboard already tracks commit activity, surface repos that have gone quiet (e.g., no commits in 30+ days) with a visual "stale" indicator and a one-click deep-link to open the repo locally or in GitHub — turning the dashboard from passive display into an active nudge system.

## 🗂️ Implement Local ↔ Remote Sync Status Diffing
Extend the filesystem metadata enrichment to detect *drift* — repos that exist locally but not on GitHub (unpushed projects), or vice versa — and display a reconciliation view. This directly leverages the "overlap detection" capability and would make the dashboard genuinely actionable for managing sprawl.

## 📊 Build a Project Health Score Card
Combine existing signals (last commit date, has README, has CLAUDE.md, has plan docs, local presence) into a per-repo health score rendered as a small visual badge. This transforms the enrichment pipeline you already have into a scannable at-a-glance prioritization tool without requiring any new data sources.