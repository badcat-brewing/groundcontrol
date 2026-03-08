# Smart Matching, Local-Only Remotes, and What's Next

Design for three interconnected features that improve how Ground Control discovers, links, and tracks projects.

## Feature 1: Smart Local-Remote Matching

### Problem

Current matching uses folder name only (`findLocalPath` checks if `localDir/repoName` exists). This misses local clones with different directory names (e.g., `~/claude/assistant` is actually `groundcontrol` on GitHub).

### Solution: Git Remote URL Matching

**New module: `scanner/remote-detect.ts`**
- `getGitRemoteUrl(projectDir)` runs `git remote get-url origin`
- Parses both HTTPS and SSH GitHub URL formats into `{ url, owner, repo }`

**Scanner changes (`scanner/index.ts`)**
- Build a URL-keyed lookup map from all scanned GitHub repos (`owner/repo` -> repo index)
- For each local dir, call `getGitRemoteUrl()` first
- Match logic:
  - URL matches a scanned repo -> `source: "synced"` (even if folder name differs)
  - URL points to a GitHub repo not in scan results -> `source: "has-remote"`
  - URL repo name doesn't match current GitHub repo name -> `hasStaleRemote: true` (transferred repo)
  - No remote at all -> `source: "local-only"`

**Type changes (`scanner/types.ts`)**
- Add `remoteUrl: string | null` to `Project`
- Add `hasStaleRemote: boolean` to `Project`
- Add `"has-remote"` to `ProjectSource` union

## Feature 2: Local-Only Flagging + Create Remote Flow

### Dashboard

- Filter chip/tab for "Local Only" projects
- Visual badge on local-only projects in the list
- "Create Remote" button on local-only project detail pages

### Create Remote Modal

Fields:
- **Repo name** — text input, defaults to folder name
- **Visibility** — public/private toggle, defaults to private
- **`.gitignore` preview** — editable textarea showing current `.gitignore` or a tech-stack-based template

### API: `POST /api/projects/[name]/create-remote`

Request body:
```ts
{
  repoName: string;
  visibility: 'public' | 'private';
  gitignore?: string;
}
```

Flow:
1. Write updated `.gitignore` to project dir (if provided)
2. Run `gh repo create <repoName> --private/--public --source <localPath> --push`
3. Return new GitHub URL
4. Update manifest: `source: "synced"`, set `githubUrl` and `remoteUrl`

Safety:
- Validate project path exists and is a git repo
- Validate repo name (alphanumeric + hyphens)
- Warn if no commits exist yet

## Feature 3: What's Next

### Convention

Each project can declare its next steps in `.groundcontrol/WHATS-NEXT.md`.

### Scanner Changes

- `scanner/local.ts`: read `.groundcontrol/WHATS-NEXT.md` content
- `scanner/types.ts`: add `whatsNext: string | null` to `Project`
- `scanner/index.ts`: pass through to manifest

### Dashboard: Project Detail

- Display "What's Next" section with rendered markdown
- If content exists: show with "Edit" button
- If no content: show "Suggest What's Next" button

**Edit flow:**
- Inline markdown editor (textarea)
- "Save Locally" — writes `.groundcontrol/WHATS-NEXT.md` via API
- "Save & Push" — writes, commits, and pushes

### API: `POST /api/projects/[name]/suggest-whats-next`

- Gathers project context from manifest (description, tech stack, CLAUDE.md, README, status, commit activity)
- Calls Claude API (claude-sonnet-4-6) with project context
- Returns 2-3 concrete, creative next steps

### API: `POST /api/projects/[name]/whats-next`

Request body:
```ts
{
  content: string;
  push?: boolean;
}
```

Flow:
1. Create `.groundcontrol/` dir if needed
2. Write `WHATS-NEXT.md`
3. If `push: true`: stage, commit ("Update what's next"), push

## Environment Changes

- `ANTHROPIC_API_KEY` in `.env.local` (already added)
- Add `@anthropic-ai/sdk` dependency

## Dependencies Between Features

Feature 1 (smart matching) should be built first — it changes the `source` classification that Feature 2 relies on. Feature 3 is independent and can be built in parallel with Feature 2.
