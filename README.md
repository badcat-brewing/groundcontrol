# Project PM

A GitHub-aware project manager that helps you track what's active, what's abandoned, where you left off, and whether you're building the same thing in multiple places.

## The Problem

When you have 50+ repos and use Claude Code across all of them, it's easy to:
- Forget where you left off on a project
- Let projects go stale without realizing it
- Build the same functionality in multiple repos
- Lose track of planning docs and TODOs

## The Solution

Project PM scans all your GitHub repos, enriches them with local filesystem data (CLAUDE.md, README, plan docs, TODOs, dependencies), and presents everything in a filterable dashboard.

### Features

- **Status tracking**: Automatically classifies projects as active/recent/stale/abandoned based on commit activity
- **Project detail**: See where you left off — last commit, open PRs, branches, planning docs
- **Overlap detection**: Identifies projects that share capabilities (email, auth, file storage, etc.) to prevent duplication
- **Manual overrides**: Tag projects, add notes, pause/override status for context that git can't capture
- **Capability extraction**: Parses CLAUDE.md and README files to build a functional inventory using controlled vocabulary mapping

## Quick Start

1. Clone the repo
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your GitHub token and username
4. `npm run scan` to generate the project manifest
5. `npm run dev` to open the dashboard at http://localhost:3000

## Screenshots

_Coming soon_

## Tech Stack

- Next.js 16 (App Router) + Tailwind CSS v4
- Octokit for GitHub API
- Vitest for testing
- TypeScript throughout
