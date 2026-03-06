# Ground Control — Remote Repo Visibility

## Vision

Add first-class visibility into all GitHub repos the user's token has access to, regardless of whether they're cloned locally. The dashboard should clearly distinguish **local**, **remote-only**, and **synced** (both) repos, and for synced repos, surface how the local copy differs from the remote.

## Current State

- Scanner already fetches all repos via GitHub API and enriches with local filesystem data
- Remote-only repos get CLAUDE.md, README.md, package.json fetched via API
- `project.path` is null for remote-only repos, but the UI doesn't surface this distinction
- No comparison between local and remote state for repos that exist in both places

## Desired Outcome

1. **Source indicator** on every project: `local-only`, `remote-only`, or `synced`
2. **Enhanced remote scanning** — fetch more metadata from GitHub API for remote-only repos (languages, topics, license, size, visibility)
3. **Local vs remote diff** for synced repos — show divergence (ahead/behind commits, branch differences, uncommitted changes)
4. **Dashboard updates** — source badges, filter by source type, diff summary in project detail
5. **Feature branch** — all work on a dedicated branch

## Non-Goals

- No bi-directional sync (no pushing/pulling from the dashboard)
- No git operations beyond read-only comparison
- No new authentication flows

## Tech Context

- Next.js 16, Tailwind CSS v4, TypeScript, Octokit, Vitest
- Scanner CLI in `scanner/`, Dashboard in `src/`
- Manifest at `data/manifest.json`, overrides at `data/overrides.json`
