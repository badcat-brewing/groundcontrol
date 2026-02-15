# Project PM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a monolith Next.js app that scans GitHub repos + local filesystem to produce a project status dashboard with overlap detection.

**Architecture:** CLI scanner writes a JSON manifest from GitHub API + local file reads. Next.js App Router dashboard reads the manifest and renders overview, detail, and overlap views. Manual overrides stored in a separate committed JSON file.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Octokit, tsx (for running scanner), Vitest (testing)

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `.gitignore`
- Create: `.env.local.example`
- Create: `data/overrides.json`
- Create: `scanner/types.ts`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/frankrydzewski/claude/assistant
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Accept defaults. This creates the Next.js scaffold with Tailwind and App Router.

**Step 2: Install scanner dependencies**

Run:
```bash
npm install octokit
npm install -D tsx vitest @types/node
```

**Step 3: Create shared types**

Create `scanner/types.ts` with the `Project`, `ProjectManifest`, `ProjectStatus`, and `Overrides` interfaces from the design doc. These are shared between scanner and dashboard.

```typescript
export type ProjectStatus = 'active' | 'recent' | 'stale' | 'abandoned' | 'paused';

export interface Project {
  name: string;
  path: string | null;
  githubUrl: string | null;

  lastCommitDate: string | null;
  commitCountLast30Days: number;
  openPRCount: number;
  defaultBranch: string;
  branchCount: number;

  hasClaude: boolean;
  hasReadme: boolean;
  hasPlanDocs: boolean;
  hasTodos: boolean;

  description: string | null;
  techStack: string[];
  capabilities: string[];

  tags: string[];
  status: ProjectStatus | null;
  notes: string | null;

  computedStatus: ProjectStatus;
}

export interface ProjectManifest {
  generatedAt: string;
  projects: Project[];
}

export interface Overrides {
  [projectName: string]: {
    tags?: string[];
    status?: ProjectStatus;
    notes?: string;
  };
}
```

**Step 4: Create data directory and seed files**

Create `data/overrides.json`:
```json
{}
```

**Step 5: Update .gitignore**

Add to `.gitignore`:
```
data/manifest.json
.env.local
```

**Step 6: Create .env.local.example**

```
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USERNAME=your_username
LOCAL_PROJECTS_DIR=/Users/you/claude
```

**Step 7: Add scanner scripts to package.json**

Add to `scripts`:
```json
"scan": "tsx scanner/index.ts"
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with Next.js, Tailwind, and scanner types"
```

---

### Task 2: Status Computation Module

**Files:**
- Create: `scanner/status.ts`
- Create: `scanner/__tests__/status.test.ts`

**Step 1: Write failing tests for status computation**

Create `scanner/__tests__/status.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeStatus } from '../status';

describe('computeStatus', () => {
  const now = new Date('2026-02-15T12:00:00Z');

  it('returns active for commits within 7 days', () => {
    expect(computeStatus('2026-02-10T00:00:00Z', now)).toBe('active');
  });

  it('returns recent for commits within 30 days', () => {
    expect(computeStatus('2026-01-20T00:00:00Z', now)).toBe('recent');
  });

  it('returns stale for commits within 90 days', () => {
    expect(computeStatus('2025-12-01T00:00:00Z', now)).toBe('stale');
  });

  it('returns abandoned for commits older than 90 days', () => {
    expect(computeStatus('2025-01-01T00:00:00Z', now)).toBe('abandoned');
  });

  it('returns abandoned when lastCommitDate is null', () => {
    expect(computeStatus(null, now)).toBe('abandoned');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scanner/__tests__/status.test.ts`
Expected: FAIL — module not found

**Step 3: Implement status computation**

Create `scanner/status.ts`:

```typescript
import { ProjectStatus } from './types';

const DAY_MS = 86_400_000;

export function computeStatus(
  lastCommitDate: string | null,
  now: Date = new Date()
): ProjectStatus {
  if (!lastCommitDate) return 'abandoned';

  const daysSince = (now.getTime() - new Date(lastCommitDate).getTime()) / DAY_MS;

  if (daysSince <= 7) return 'active';
  if (daysSince <= 30) return 'recent';
  if (daysSince <= 90) return 'stale';
  return 'abandoned';
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scanner/__tests__/status.test.ts`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add scanner/status.ts scanner/__tests__/status.test.ts
git commit -m "feat: add status computation module with tests"
```

---

### Task 3: Capability Extractor Module

**Files:**
- Create: `scanner/extractor.ts`
- Create: `scanner/__tests__/extractor.test.ts`

**Step 1: Write failing tests for description extraction**

Create `scanner/__tests__/extractor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { extractDescription, extractCapabilities, detectTechStack } from '../extractor';

describe('extractDescription', () => {
  it('extracts first non-heading paragraph from markdown', () => {
    const md = '# My Project\n\nThis is a cool project that does things.\n\n## Features\n\n- stuff';
    expect(extractDescription(md)).toBe('This is a cool project that does things.');
  });

  it('returns null for empty content', () => {
    expect(extractDescription('')).toBeNull();
  });

  it('skips badge lines and blank lines', () => {
    const md = '# Title\n\n![badge](url)\n\nActual description here.';
    expect(extractDescription(md)).toBe('Actual description here.');
  });
});

describe('extractCapabilities', () => {
  it('maps known keywords to canonical capabilities', () => {
    const md = '## Features\n\n- Email sending via SES\n- JWT authentication\n- S3 file uploads';
    const caps = extractCapabilities(md);
    expect(caps).toContain('email-sending');
    expect(caps).toContain('authentication');
    expect(caps).toContain('file-storage');
  });

  it('deduplicates capabilities', () => {
    const md = '- Email via SMTP\n- SES integration\n- Sendgrid backup';
    const caps = extractCapabilities(md);
    const emailCount = caps.filter(c => c === 'email-sending').length;
    expect(emailCount).toBe(1);
  });

  it('returns empty array when no capabilities match', () => {
    expect(extractCapabilities('# Just a title')).toEqual([]);
  });
});

describe('detectTechStack', () => {
  it('detects from package.json dependencies', () => {
    const deps = { 'next': '15.0.0', 'express': '4.0.0', '@aws-sdk/client-s3': '3.0.0' };
    const stack = detectTechStack(deps, []);
    expect(stack).toContain('next.js');
    expect(stack).toContain('express');
    expect(stack).toContain('aws-s3');
  });

  it('detects from file extensions', () => {
    const stack = detectTechStack({}, ['.py', '.go', '.ts']);
    expect(stack).toContain('python');
    expect(stack).toContain('go');
    expect(stack).toContain('typescript');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scanner/__tests__/extractor.test.ts`
Expected: FAIL — module not found

**Step 3: Implement extractor**

Create `scanner/extractor.ts`:

```typescript
const CAPABILITY_MAP: Record<string, string> = {
  'email': 'email-sending',
  'smtp': 'email-sending',
  'ses': 'email-sending',
  'sendgrid': 'email-sending',
  'auth': 'authentication',
  'login': 'authentication',
  'oauth': 'authentication',
  'jwt': 'authentication',
  's3': 'file-storage',
  'upload': 'file-storage',
  'api': 'api-server',
  'express': 'api-server',
  'fastify': 'api-server',
  'websocket': 'realtime',
  'socket': 'realtime',
  'database': 'database',
  'postgres': 'database',
  'mysql': 'database',
  'mongo': 'database',
  'dynamodb': 'database',
  'redis': 'caching',
  'cache': 'caching',
  'queue': 'message-queue',
  'sqs': 'message-queue',
  'cron': 'scheduling',
  'schedule': 'scheduling',
};

const DEP_STACK_MAP: Record<string, string> = {
  'next': 'next.js',
  'react': 'react',
  'express': 'express',
  'fastify': 'fastify',
  '@aws-sdk/client-s3': 'aws-s3',
  '@aws-sdk/client-ses': 'aws-ses',
  '@aws-sdk/client-dynamodb': 'aws-dynamodb',
  'tailwindcss': 'tailwind',
};

const EXT_STACK_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
};

export function extractDescription(markdown: string): string | null {
  if (!markdown.trim()) return null;

  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('![')) continue;
    if (trimmed.startsWith('[![')) continue;
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) continue;
    if (trimmed.startsWith('```')) continue;
    return trimmed;
  }
  return null;
}

export function extractCapabilities(markdown: string): string[] {
  const lower = markdown.toLowerCase();
  const found = new Set<string>();

  for (const [keyword, capability] of Object.entries(CAPABILITY_MAP)) {
    if (lower.includes(keyword)) {
      found.add(capability);
    }
  }

  return Array.from(found).sort();
}

export function detectTechStack(
  dependencies: Record<string, string>,
  fileExtensions: string[]
): string[] {
  const stack = new Set<string>();

  for (const dep of Object.keys(dependencies)) {
    const mapped = DEP_STACK_MAP[dep];
    if (mapped) stack.add(mapped);
  }

  for (const ext of fileExtensions) {
    const mapped = EXT_STACK_MAP[ext];
    if (mapped) stack.add(mapped);
  }

  return Array.from(stack).sort();
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scanner/__tests__/extractor.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add scanner/extractor.ts scanner/__tests__/extractor.test.ts
git commit -m "feat: add capability extractor with vocabulary mapping and tests"
```

---

### Task 4: GitHub API Client

**Files:**
- Create: `scanner/github.ts`
- Create: `scanner/__tests__/github.test.ts`

**Step 1: Write failing tests for GitHub data transformation**

We test the data transformation logic, not the API calls themselves. Create `scanner/__tests__/github.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { transformRepoData } from '../github';

describe('transformRepoData', () => {
  it('transforms GitHub API repo response to partial Project', () => {
    const repo = {
      name: 'my-project',
      html_url: 'https://github.com/user/my-project',
      default_branch: 'main',
      pushed_at: '2026-02-10T00:00:00Z',
    };
    const result = transformRepoData(repo);
    expect(result.name).toBe('my-project');
    expect(result.githubUrl).toBe('https://github.com/user/my-project');
    expect(result.defaultBranch).toBe('main');
    expect(result.lastCommitDate).toBe('2026-02-10T00:00:00Z');
  });

  it('handles null pushed_at', () => {
    const repo = {
      name: 'empty-repo',
      html_url: 'https://github.com/user/empty-repo',
      default_branch: 'main',
      pushed_at: null,
    };
    const result = transformRepoData(repo);
    expect(result.lastCommitDate).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scanner/__tests__/github.test.ts`
Expected: FAIL

**Step 3: Implement GitHub client**

Create `scanner/github.ts`:

```typescript
import { Octokit } from 'octokit';

interface RepoData {
  name: string;
  html_url: string;
  default_branch: string;
  pushed_at: string | null;
}

export interface PartialProject {
  name: string;
  githubUrl: string;
  defaultBranch: string;
  lastCommitDate: string | null;
  branchCount: number;
  openPRCount: number;
  commitCountLast30Days: number;
}

export function transformRepoData(repo: RepoData): PartialProject {
  return {
    name: repo.name,
    githubUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    lastCommitDate: repo.pushed_at,
    branchCount: 0,
    openPRCount: 0,
    commitCountLast30Days: 0,
  };
}

export async function fetchAllRepos(token: string, username: string): Promise<PartialProject[]> {
  const octokit = new Octokit({ auth: token });

  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: 'pushed',
    affiliation: 'owner',
  });

  const projects: PartialProject[] = [];

  for (const repo of repos) {
    const partial = transformRepoData({
      name: repo.name,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      pushed_at: repo.pushed_at ?? null,
    });

    // Fetch enrichment data in parallel
    const [branches, pulls, commits] = await Promise.all([
      octokit.rest.repos.listBranches({ owner: username, repo: repo.name, per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.rest.pulls.list({ owner: username, repo: repo.name, state: 'open', per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.rest.repos.getCommitActivityStats({ owner: username, repo: repo.name })
        .then(r => {
          if (!Array.isArray(r.data)) return 0;
          // Sum last 4 weeks
          return r.data.slice(-4).reduce((sum, week) => sum + week.total, 0);
        }).catch(() => 0),
    ]);

    partial.branchCount = branches;
    partial.openPRCount = pulls;
    partial.commitCountLast30Days = commits;

    projects.push(partial);
  }

  return projects;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scanner/__tests__/github.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add scanner/github.ts scanner/__tests__/github.test.ts
git commit -m "feat: add GitHub API client with repo fetching and data transformation"
```

---

### Task 5: Local Filesystem Reader

**Files:**
- Create: `scanner/local.ts`
- Create: `scanner/__tests__/local.test.ts`

**Step 1: Write failing tests**

Create `scanner/__tests__/local.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readLocalProject } from '../local';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(__dirname, '__fixtures__', 'test-project');

describe('readLocalProject', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(join(__dirname, '__fixtures__'), { recursive: true, force: true });
  });

  it('detects CLAUDE.md and README.md', () => {
    writeFileSync(join(TEST_DIR, 'CLAUDE.md'), '# My Project\n\nA cool project.');
    writeFileSync(join(TEST_DIR, 'README.md'), '# Readme');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasClaude).toBe(true);
    expect(result.hasReadme).toBe(true);
    expect(result.claudeContent).toContain('A cool project');
  });

  it('detects plan docs', () => {
    mkdirSync(join(TEST_DIR, 'docs', 'plans'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'docs', 'plans', 'plan.md'), '# Plan');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasPlanDocs).toBe(true);
  });

  it('detects TODO files', () => {
    writeFileSync(join(TEST_DIR, 'TODO.md'), '- [ ] Do thing');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasTodos).toBe(true);
  });

  it('collects file extensions', () => {
    writeFileSync(join(TEST_DIR, 'index.ts'), '');
    writeFileSync(join(TEST_DIR, 'app.py'), '');
    const result = readLocalProject(TEST_DIR);
    expect(result.fileExtensions).toContain('.ts');
    expect(result.fileExtensions).toContain('.py');
  });

  it('reads package.json dependencies', () => {
    writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({
      dependencies: { 'next': '15.0.0' },
      devDependencies: { 'vitest': '1.0.0' },
    }));
    const result = readLocalProject(TEST_DIR);
    expect(result.dependencies).toHaveProperty('next');
    expect(result.dependencies).toHaveProperty('vitest');
  });

  it('returns sensible defaults for empty directory', () => {
    const result = readLocalProject(TEST_DIR);
    expect(result.hasClaude).toBe(false);
    expect(result.hasReadme).toBe(false);
    expect(result.hasPlanDocs).toBe(false);
    expect(result.hasTodos).toBe(false);
    expect(result.claudeContent).toBeNull();
    expect(result.readmeContent).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scanner/__tests__/local.test.ts`
Expected: FAIL

**Step 3: Implement local reader**

Create `scanner/local.ts`:

```typescript
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface LocalProjectData {
  hasClaude: boolean;
  hasReadme: boolean;
  hasPlanDocs: boolean;
  hasTodos: boolean;
  claudeContent: string | null;
  readmeContent: string | null;
  fileExtensions: string[];
  dependencies: Record<string, string>;
}

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function collectExtensions(dir: string, maxDepth: number = 2): string[] {
  const extensions = new Set<string>();
  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else {
          const ext = extname(entry.name);
          if (ext) extensions.add(ext);
        }
      }
    } catch {
      // permission errors, etc.
    }
  }
  walk(dir, 0);
  return Array.from(extensions);
}

export function readLocalProject(projectDir: string): LocalProjectData {
  const claudeContent = readFileOrNull(join(projectDir, 'CLAUDE.md'));
  const readmeContent = readFileOrNull(join(projectDir, 'README.md'));

  const planDocsDir = join(projectDir, 'docs', 'plans');
  let hasPlanDocs = false;
  try {
    const planFiles = readdirSync(planDocsDir);
    hasPlanDocs = planFiles.some(f => f.endsWith('.md'));
  } catch {
    hasPlanDocs = false;
  }

  const todoNames = ['TODO.md', 'TODO', 'TODOS.md', 'TO-DOS.md'];
  const hasTodos = todoNames.some(name => existsSync(join(projectDir, name)));

  let dependencies: Record<string, string> = {};
  const pkgContent = readFileOrNull(join(projectDir, 'package.json'));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      // malformed package.json
    }
  }

  return {
    hasClaude: claudeContent !== null,
    hasReadme: readmeContent !== null,
    hasPlanDocs,
    hasTodos,
    claudeContent,
    readmeContent,
    fileExtensions: collectExtensions(projectDir),
    dependencies,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scanner/__tests__/local.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add scanner/local.ts scanner/__tests__/local.test.ts
git commit -m "feat: add local filesystem reader for project metadata"
```

---

### Task 6: Scanner Orchestrator (CLI Entry Point)

**Files:**
- Create: `scanner/index.ts`

**Step 1: Implement the scanner orchestrator**

This wires together GitHub client, local reader, extractor, and status modules. Create `scanner/index.ts`:

```typescript
import { fetchAllRepos } from './github';
import { readLocalProject } from './local';
import { extractDescription, extractCapabilities, detectTechStack } from './extractor';
import { computeStatus } from './status';
import { Project, ProjectManifest, Overrides } from './types';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(__dirname, '..', 'data');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');
const OVERRIDES_PATH = join(DATA_DIR, 'overrides.json');

function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function findLocalPath(name: string, localDir: string): string | null {
  const candidate = join(localDir, name);
  try {
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const localDir = process.env.LOCAL_PROJECTS_DIR;

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN or GITHUB_USERNAME in environment');
    process.exit(1);
  }

  console.log(`Fetching repos for ${username}...`);
  const repos = await fetchAllRepos(token, username);
  console.log(`Found ${repos.length} repos on GitHub`);

  const overrides = loadOverrides();
  const projects: Project[] = [];

  for (const repo of repos) {
    const localPath = localDir ? findLocalPath(repo.name, localDir) : null;
    let local = {
      hasClaude: false,
      hasReadme: false,
      hasPlanDocs: false,
      hasTodos: false,
      claudeContent: null as string | null,
      readmeContent: null as string | null,
      fileExtensions: [] as string[],
      dependencies: {} as Record<string, string>,
    };

    if (localPath) {
      local = readLocalProject(localPath);
    }

    const docContent = local.claudeContent || local.readmeContent || '';
    const description = extractDescription(docContent);
    const capabilities = extractCapabilities(docContent);
    const techStack = detectTechStack(local.dependencies, local.fileExtensions);

    const override = overrides[repo.name] || {};
    const computed = computeStatus(repo.lastCommitDate);

    projects.push({
      name: repo.name,
      path: localPath,
      githubUrl: repo.githubUrl,
      lastCommitDate: repo.lastCommitDate,
      commitCountLast30Days: repo.commitCountLast30Days,
      openPRCount: repo.openPRCount,
      defaultBranch: repo.defaultBranch,
      branchCount: repo.branchCount,
      hasClaude: local.hasClaude,
      hasReadme: local.hasReadme,
      hasPlanDocs: local.hasPlanDocs,
      hasTodos: local.hasTodos,
      description,
      techStack,
      capabilities,
      tags: override.tags || [],
      status: override.status || null,
      notes: override.notes || null,
      computedStatus: override.status || computed,
    });
  }

  // Sort: active first, then recent, stale, abandoned
  const statusOrder: Record<string, number> = { active: 0, recent: 1, stale: 2, paused: 3, abandoned: 4 };
  projects.sort((a, b) => statusOrder[a.computedStatus] - statusOrder[b.computedStatus]);

  const manifest: ProjectManifest = {
    generatedAt: new Date().toISOString(),
    projects,
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${projects.length} projects to ${MANIFEST_PATH}`);

  // Print summary
  const counts = projects.reduce((acc, p) => {
    acc[p.computedStatus] = (acc[p.computedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nSummary:');
  for (const [status, count] of Object.entries(counts)) {
    console.log(`  ${status}: ${count}`);
  }
}

main().catch(err => {
  console.error('Scanner failed:', err);
  process.exit(1);
});
```

**Step 2: Test manually**

Run: `npm run scan`
Expected: Fetches repos, prints summary, writes `data/manifest.json`

**Step 3: Commit**

```bash
git add scanner/index.ts
git commit -m "feat: add scanner CLI orchestrator"
```

---

### Task 7: Dashboard — Manifest Reader & Overview Page

**Files:**
- Create: `src/lib/manifest.ts`
- Modify: `src/app/page.tsx`
- Create: `src/components/SummaryCards.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/ProjectTable.tsx`

**Step 1: Create manifest reader**

Create `src/lib/manifest.ts` — reads `data/manifest.json` from disk in server components:

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ProjectManifest } from '../../scanner/types';

const MANIFEST_PATH = join(process.cwd(), 'data', 'manifest.json');

export function readManifest(): ProjectManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return null;
  }
}
```

**Step 2: Create SummaryCards component**

Create `src/components/SummaryCards.tsx` — displays count cards for each status:

```tsx
import { Project } from '../../scanner/types';

interface Props {
  projects: Project[];
}

export function SummaryCards({ projects }: Props) {
  const counts = {
    total: projects.length,
    active: projects.filter(p => p.computedStatus === 'active').length,
    recent: projects.filter(p => p.computedStatus === 'recent').length,
    stale: projects.filter(p => p.computedStatus === 'stale').length,
    abandoned: projects.filter(p => p.computedStatus === 'abandoned').length,
    paused: projects.filter(p => p.computedStatus === 'paused').length,
  };

  const cards = [
    { label: 'Total', count: counts.total, color: 'bg-gray-100 text-gray-800' },
    { label: 'Active', count: counts.active, color: 'bg-green-100 text-green-800' },
    { label: 'Recent', count: counts.recent, color: 'bg-blue-100 text-blue-800' },
    { label: 'Stale', count: counts.stale, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Abandoned', count: counts.abandoned, color: 'bg-red-100 text-red-800' },
    { label: 'Paused', count: counts.paused, color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(card => (
        <div key={card.label} className={`rounded-lg p-4 ${card.color}`}>
          <div className="text-2xl font-bold">{card.count}</div>
          <div className="text-sm font-medium">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Create StatusBadge component**

Create `src/components/StatusBadge.tsx`:

```tsx
import { ProjectStatus } from '../../scanner/types';

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: 'bg-green-100 text-green-800',
  recent: 'bg-blue-100 text-blue-800',
  stale: 'bg-yellow-100 text-yellow-800',
  abandoned: 'bg-red-100 text-red-800',
  paused: 'bg-purple-100 text-purple-800',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
```

**Step 4: Create ProjectTable component**

Create `src/components/ProjectTable.tsx` — a client component with sorting and filtering. This is the largest component. Key columns: name (linked), status badge, last commit (relative time), description, tech stack tags, capability tags.

The component should:
- Accept `projects: Project[]` as prop
- Maintain local state for sort column, sort direction, and status filter
- Render a `<table>` with clickable column headers for sorting
- Filter row visibility by status dropdown
- Link project names to `/projects/[name]`

**Step 5: Wire up the overview page**

Replace `src/app/page.tsx` with a server component that reads the manifest and renders SummaryCards + ProjectTable. Show an empty state with instructions to run `npm run scan` if no manifest exists.

**Step 6: Verify visually**

Run: `npm run dev`
Open: `http://localhost:3000`
Expected: Summary cards and project table rendered (or empty state if no manifest)

**Step 7: Commit**

```bash
git add src/lib/manifest.ts src/components/SummaryCards.tsx src/components/StatusBadge.tsx src/components/ProjectTable.tsx src/app/page.tsx
git commit -m "feat: add dashboard overview with summary cards and project table"
```

---

### Task 8: Dashboard — Project Detail Page

**Files:**
- Create: `src/app/projects/[name]/page.tsx`
- Create: `src/components/ProjectDetail.tsx`

**Step 1: Create ProjectDetail component**

Create `src/components/ProjectDetail.tsx` — displays full project info:

- Header with name, status badge, GitHub link
- Description section
- "Where I left off" section: last commit date, commit count, open PRs, open branches
- Metadata: tech stack tags, capability tags, user tags
- Plan docs indicator (has plans: yes/no, has TODOs: yes/no)
- Notes section (from overrides)

**Step 2: Create the dynamic route page**

Create `src/app/projects/[name]/page.tsx` — server component that:
- Reads manifest
- Finds the project by `params.name` (URL-decoded)
- Renders ProjectDetail
- Shows 404 if project not found

**Step 3: Verify visually**

Run: `npm run dev`
Navigate to a project detail by clicking a row in the table.
Expected: Full project detail view renders.

**Step 4: Commit**

```bash
git add src/app/projects/[name]/page.tsx src/components/ProjectDetail.tsx
git commit -m "feat: add project detail page with metadata and status display"
```

---

### Task 9: Dashboard — Overlap Detector Page

**Files:**
- Create: `src/lib/overlaps.ts`
- Create: `src/app/overlaps/page.tsx`
- Create: `src/components/OverlapGrid.tsx`
- Create: `scanner/__tests__/overlaps.test.ts`

**Step 1: Write failing tests for overlap grouping**

Create `scanner/__tests__/overlaps.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { findOverlaps } from '../../src/lib/overlaps';
import { Project, ProjectStatus } from '../types';

function makeProject(name: string, capabilities: string[]): Project {
  return {
    name, capabilities, path: null, githubUrl: null, lastCommitDate: null,
    commitCountLast30Days: 0, openPRCount: 0, defaultBranch: 'main', branchCount: 1,
    hasClaude: false, hasReadme: false, hasPlanDocs: false, hasTodos: false,
    description: null, techStack: [], tags: [], status: null, computedStatus: 'active' as ProjectStatus,
  };
}

describe('findOverlaps', () => {
  it('groups projects sharing a capability', () => {
    const projects = [
      makeProject('email-forwarder', ['email-sending']),
      makeProject('letter-rip', ['email-sending', 'api-server']),
      makeProject('photo-app', ['file-storage']),
    ];
    const overlaps = findOverlaps(projects);
    expect(overlaps['email-sending']).toHaveLength(2);
    expect(overlaps['email-sending'].map(p => p.name)).toContain('email-forwarder');
    expect(overlaps['email-sending'].map(p => p.name)).toContain('letter-rip');
  });

  it('excludes capabilities with only one project', () => {
    const projects = [
      makeProject('solo', ['file-storage']),
    ];
    const overlaps = findOverlaps(projects);
    expect(overlaps['file-storage']).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scanner/__tests__/overlaps.test.ts`
Expected: FAIL

**Step 3: Implement overlap detection**

Create `src/lib/overlaps.ts`:

```typescript
import { Project } from '../../scanner/types';

export interface OverlapMap {
  [capability: string]: Project[];
}

export function findOverlaps(projects: Project[]): OverlapMap {
  const capabilityGroups: Record<string, Project[]> = {};

  for (const project of projects) {
    for (const cap of project.capabilities) {
      if (!capabilityGroups[cap]) capabilityGroups[cap] = [];
      capabilityGroups[cap].push(project);
    }
  }

  // Only return capabilities shared by 2+ projects
  const overlaps: OverlapMap = {};
  for (const [cap, group] of Object.entries(capabilityGroups)) {
    if (group.length >= 2) {
      overlaps[cap] = group;
    }
  }

  return overlaps;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scanner/__tests__/overlaps.test.ts`
Expected: All tests PASS

**Step 5: Create OverlapGrid component**

Create `src/components/OverlapGrid.tsx` — renders capability groups:

- Each capability as a card/section header
- Lists the projects that share it, with status badges and links to detail pages
- Sorted by number of overlapping projects (most overlap first)

**Step 6: Create overlaps page**

Create `src/app/overlaps/page.tsx` — server component that reads manifest, calls `findOverlaps`, renders OverlapGrid.

**Step 7: Verify visually**

Run: `npm run dev`
Navigate to `/overlaps`
Expected: Capability overlap groups displayed

**Step 8: Commit**

```bash
git add src/lib/overlaps.ts src/components/OverlapGrid.tsx src/app/overlaps/page.tsx scanner/__tests__/overlaps.test.ts
git commit -m "feat: add overlap detector page with capability grouping"
```

---

### Task 10: Dashboard — Filter Bar & Navigation

**Files:**
- Create: `src/components/FilterBar.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create FilterBar component**

Create `src/components/FilterBar.tsx` — client component with:

- Status filter (multi-select checkboxes or dropdown)
- Tech stack filter (dropdown built from all tech stacks in manifest)
- "Has CLAUDE.md" toggle
- Search input for project name
- Communicates filter state up to ProjectTable via props/callbacks

**Step 2: Update layout with navigation**

Modify `src/app/layout.tsx` to add a top nav bar with links to:
- `/` (Overview)
- `/overlaps` (Overlap Detector)
- App title "Project PM"

**Step 3: Integrate FilterBar into overview page**

Wire FilterBar into the overview page so filters apply to the ProjectTable.

**Step 4: Verify visually**

Run: `npm run dev`
Test filtering by status, searching by name, navigating between pages.

**Step 5: Commit**

```bash
git add src/components/FilterBar.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add filter bar, search, and navigation"
```

---

### Task 11: Override Editing (Tags, Notes, Status)

**Files:**
- Create: `src/app/api/overrides/route.ts`
- Modify: `src/components/ProjectDetail.tsx`

**Step 1: Create API route for overrides**

Create `src/app/api/overrides/route.ts` — a POST endpoint that:

- Accepts `{ projectName, tags?, status?, notes? }`
- Reads current `data/overrides.json`
- Merges the update for the given project
- Writes back to `data/overrides.json`
- Returns updated overrides

```typescript
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { Overrides } from '../../../scanner/types';

const OVERRIDES_PATH = join(process.cwd(), 'data', 'overrides.json');

function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectName, ...updates } = body;

  if (!projectName) {
    return NextResponse.json({ error: 'projectName required' }, { status: 400 });
  }

  const overrides = loadOverrides();
  overrides[projectName] = { ...overrides[projectName], ...updates };
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));

  return NextResponse.json(overrides[projectName]);
}
```

**Step 2: Add edit controls to ProjectDetail**

Add to `src/components/ProjectDetail.tsx`:
- Tag editor (input + add button, display as removable chips)
- Status override dropdown (active/recent/stale/abandoned/paused/auto)
- Notes textarea with save button
- All call the `/api/overrides` endpoint on save

**Step 3: Verify**

Run: `npm run dev`, navigate to a project detail, add a tag, change status, write a note. Verify `data/overrides.json` is updated.

**Step 4: Commit**

```bash
git add src/app/api/overrides/route.ts src/components/ProjectDetail.tsx
git commit -m "feat: add override editing for tags, notes, and status"
```

---

### Task 12: Scan Button & Export

**Files:**
- Create: `src/app/api/scan/route.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create scan API route**

Create `src/app/api/scan/route.ts` — a POST endpoint that spawns the scanner:

```typescript
import { exec } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST() {
  return new Promise<NextResponse>((resolve) => {
    exec('npm run scan', { cwd: process.cwd(), env: process.env }, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: stderr || error.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ output: stdout }));
      }
    });
  });
}
```

**Step 2: Add scan button to layout/nav**

Add a "Scan Now" button to the nav bar that calls `/api/scan` and shows a loading state while scanning, then reloads the page.

**Step 3: Add export button**

Add an "Export JSON" link to the nav that downloads `data/manifest.json` as a file.

**Step 4: Verify**

Click "Scan Now", wait for completion, verify dashboard refreshes with new data.

**Step 5: Commit**

```bash
git add src/app/api/scan/route.ts src/app/layout.tsx
git commit -m "feat: add scan trigger button and manifest export"
```

---

### Task 13: Final Polish & README

**Files:**
- Create: `CLAUDE.md`
- Modify: `README.md` (generated by create-next-app)

**Step 1: Write CLAUDE.md**

Project description, architecture overview, key commands (`npm run scan`, `npm run dev`), file structure, and development notes.

**Step 2: Update README.md**

Replace the create-next-app README with:
- What Project PM is
- Setup instructions (clone, npm install, create .env.local with GitHub token)
- Usage: `npm run scan` then `npm run dev`
- Screenshots placeholder

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add CLAUDE.md and update README with setup instructions"
```

---

## Task Dependency Summary

```
Task 1 (Scaffold) ──┬── Task 2 (Status) ──────────┐
                     ├── Task 3 (Extractor) ────────┤
                     ├── Task 4 (GitHub Client) ────┼── Task 6 (Scanner CLI) ──┐
                     └── Task 5 (Local Reader) ─────┘                          │
                                                                                │
Task 7 (Overview Page) ◄──────────────────────────────────────────────────────┘
Task 8 (Detail Page) ◄── Task 7
Task 9 (Overlap Page) ◄── Task 7
Task 10 (Filters/Nav) ◄── Task 7
Task 11 (Overrides) ◄── Task 8
Task 12 (Scan/Export) ◄── Task 7
Task 13 (Polish) ◄── All
```
