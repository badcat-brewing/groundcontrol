import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchAllRepos, fetchRepoFiles, type PartialProject, type FetchResult } from './github';
import { readLocalProject } from './local';
import { extractDescription, extractCapabilities, detectTechStack } from './extractor';
import { computeStatus } from './status';
import { computeLocalRemoteDiff } from './diff';
import { getGitRemoteUrl } from './remote-detect';
import { Project, ProjectManifest } from './types';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { homedir } from 'os';
import type { OnProgress } from './progress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { loadOverrides } from './overrides';

const DATA_DIR = join(__dirname, '..', 'data');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');

function findLocalPath(name: string, localDir: string): string | null {
  const candidate = join(localDir, name);
  try {
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function discoverLocalDirs(localDir: string): string[] {
  try {
    return readdirSync(localDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

function getLastCommitDate(projectDir: string): string | null {
  try {
    const { execSync } = require('child_process');
    const result = execSync('git log -1 --format=%aI', { cwd: projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result.trim() || null;
  } catch {
    return null;
  }
}

export interface ScanOptions {
  token: string;
  username: string;
  localDir?: string;
  org?: string;
  orgs?: string[];
  onProgress?: OnProgress;
}

export async function runScan(options: ScanOptions): Promise<ProjectManifest> {
  const { token, username, localDir, org, orgs, onProgress } = options;
  const startTime = Date.now();

  // Build list of all orgs to scan (merge --org flag and orgs array, dedup)
  const allOrgs = new Set<string>();
  if (org) allOrgs.add(org);
  if (orgs) orgs.forEach(o => allOrgs.add(o));

  const repos: PartialProject[] = [];
  let octokit: FetchResult['octokit'] | null = null;
  const seenRepoKeys = new Set<string>();

  // Legacy single-org mode: --org flag with no orgs array fetches ONLY that org (backward compat)
  const legacySingleOrg = org && !orgs;

  if (!legacySingleOrg) {
    // Fetch user repos
    const userResult = await fetchAllRepos(token, username, undefined, onProgress);
    octokit = userResult.octokit;
    for (const repo of userResult.projects) {
      repos.push(repo);
      seenRepoKeys.add(repo.name);
    }
  }

  // Fetch repos for each org
  for (const orgName of allOrgs) {
    onProgress?.({ phase: 'fetching', current: 0, total: 0, repoName: `org: ${orgName}` });
    const orgResult = await fetchAllRepos(token, username, orgName, onProgress);
    if (!octokit) octokit = orgResult.octokit;

    for (const repo of orgResult.projects) {
      // Prefix org repos with org/repo to avoid name collisions with user repos
      const prefixedName = legacySingleOrg ? repo.name : `${orgName}/${repo.name}`;
      if (!seenRepoKeys.has(prefixedName)) {
        repo.name = prefixedName;
        repos.push(repo);
        seenRepoKeys.add(prefixedName);
      }
    }
  }

  // Build owner/repo -> index lookup from GitHub repos for remote URL matching
  const repoLookup = new Map<string, number>();
  for (let i = 0; i < repos.length; i++) {
    const r = repos[i];
    const owner = r.owner;
    const repoName = r.name.includes('/') ? r.name.split('/').slice(1).join('/') : r.name;
    repoLookup.set(`${owner}/${repoName}`.toLowerCase(), i);
  }

  const overrides = loadOverrides();
  const projects: Project[] = [];

  for (const repo of repos) {
    onProgress?.({ phase: 'enriching', current: projects.length + 1, total: repos.length, repoName: repo.name });

    // For org-prefixed repos (org/repo), look up local path by just the repo name
    const repoBaseName = repo.name.includes('/') ? repo.name.split('/').slice(1).join('/') : repo.name;
    const localPath = localDir ? findLocalPath(repoBaseName, localDir) : null;
    let local = {
      hasClaude: false,
      hasReadme: false,
      hasPlanDocs: false,
      hasTodos: false,
      claudeContent: null as string | null,
      readmeContent: null as string | null,
      fileExtensions: [] as string[],
      dependencies: {} as Record<string, string>,
      whatsNextContent: null as string | null,
    };

    if (localPath) {
      local = readLocalProject(localPath);
    } else {
      const remote = await fetchRepoFiles(octokit!, repo.owner, repoBaseName);
      local.claudeContent = remote.claudeContent;
      local.readmeContent = remote.readmeContent;
      local.hasClaude = remote.claudeContent !== null;
      local.hasReadme = remote.readmeContent !== null;
      local.dependencies = remote.packageJson || {};
    }

    const docContent = local.claudeContent || local.readmeContent || '';
    const description = extractDescription(docContent);
    const capabilities = extractCapabilities(docContent);
    const techStack = detectTechStack(local.dependencies, local.fileExtensions);

    const override = overrides[repo.name] || {};
    const computed = computeStatus(repo.lastCommitDate);

    const source = localPath && repo.githubUrl ? 'synced' : (localPath ? 'local-only' : 'remote-only');

    // Detect remote URL and stale remote for synced/local repos
    // Stale = local remote points to different owner OR repo name than GitHub API reports
    const remoteInfo = localPath ? getGitRemoteUrl(localPath) : null;
    const expectedRemoteUrl = repo.githubUrl ? `${repo.githubUrl}.git` : null;
    const hasStaleRemote = !!(remoteInfo && localPath && repo.githubUrl && (
      remoteInfo.owner.toLowerCase() !== repo.owner.toLowerCase() ||
      remoteInfo.repo.toLowerCase() !== repoBaseName.toLowerCase()
    ));

    let diff = null;
    if (source === 'synced' && localPath) {
      diff = await computeLocalRemoteDiff(localPath, repo.branchNames, repo.defaultBranch);
    }

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
      source,
      visibility: repo.visibility,
      languages: repo.languages,
      topics: repo.topics,
      license: repo.license,
      sizeKB: repo.sizeKB,
      isArchived: repo.isArchived,
      isFork: repo.isFork,
      diff,
      remoteUrl: remoteInfo?.url ?? null,
      hasStaleRemote,
      expectedRemoteUrl: hasStaleRemote ? expectedRemoteUrl : null,
      whatsNext: local.whatsNextContent ?? null,
    });
  }

  // Discover local-only projects not found on GitHub
  // Uses git remote URL matching to associate local dirs with GitHub repos
  if (localDir) {
    // Include both full names (org/repo) and base names for matching against local dirs
    const githubNames = new Set<string>();
    for (const r of repos) {
      githubNames.add(r.name);
      if (r.name.includes('/')) {
        githubNames.add(r.name.split('/').slice(1).join('/'));
      }
    }
    // Track which repos have already been matched to a local path (by name)
    const matchedRepoIndices = new Set<number>();

    const localDirs = discoverLocalDirs(localDir);
    const localOnly = localDirs.filter(name => !githubNames.has(name));

    for (const name of localOnly) {
      const localPath = join(localDir, name);

      // Skip non-git directories (plain files, misc folders)
      if (!existsSync(join(localPath, '.git'))) continue;

      onProgress?.({ phase: 'enriching', current: projects.length + 1, total: repos.length + localOnly.length, repoName: name });

      // Try to match via git remote URL
      const remoteInfo = getGitRemoteUrl(localPath);
      if (remoteInfo) {
        const lookupKey = `${remoteInfo.owner}/${remoteInfo.repo}`.toLowerCase();
        const repoIdx = repoLookup.get(lookupKey);

        if (repoIdx !== undefined && !matchedRepoIndices.has(repoIdx)) {
          // Found a match — update the existing project entry to be synced
          matchedRepoIndices.add(repoIdx);
          const existingProject = projects.find(p => p.name === repos[repoIdx].name);
          if (existingProject) {
            const local = readLocalProject(localPath);
            existingProject.path = localPath;
            existingProject.source = 'synced';
            existingProject.hasClaude = local.hasClaude;
            existingProject.hasReadme = local.hasReadme;
            existingProject.hasPlanDocs = local.hasPlanDocs;
            existingProject.hasTodos = local.hasTodos;
            existingProject.remoteUrl = remoteInfo.url;
            const matchedRepoBaseName = repos[repoIdx].name.includes('/') ? repos[repoIdx].name.split('/').slice(1).join('/') : repos[repoIdx].name;
            const matchedRepoOwner = repos[repoIdx].owner;
            existingProject.hasStaleRemote = (
              remoteInfo.owner.toLowerCase() !== matchedRepoOwner.toLowerCase() ||
              remoteInfo.repo.toLowerCase() !== matchedRepoBaseName.toLowerCase()
            );
            existingProject.expectedRemoteUrl = existingProject.hasStaleRemote
              ? `https://github.com/${matchedRepoOwner}/${matchedRepoBaseName}.git`
              : null;
            existingProject.whatsNext = local.whatsNextContent ?? null;
            existingProject.diff = await computeLocalRemoteDiff(localPath, repos[repoIdx].branchNames, repos[repoIdx].defaultBranch);
          }
          continue;
        }
      }

      // No match in scanned repos
      const local = readLocalProject(localPath);
      const docContent = local.claudeContent || local.readmeContent || '';
      const description = extractDescription(docContent);
      const capabilities = extractCapabilities(docContent);
      const techStack = detectTechStack(local.dependencies, local.fileExtensions);

      const override = overrides[name] || {};
      const lastCommitDate = getLastCommitDate(localPath);
      const computed = computeStatus(lastCommitDate);

      // Determine source: has-remote if git remote exists but not in scan, local-only otherwise
      const source = remoteInfo ? 'has-remote' as const : 'local-only' as const;

      projects.push({
        name,
        path: localPath,
        githubUrl: null,
        lastCommitDate,
        commitCountLast30Days: 0,
        openPRCount: 0,
        defaultBranch: 'main',
        branchCount: 0,
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
        source,
        visibility: null,
        languages: {},
        topics: [],
        license: null,
        sizeKB: 0,
        isArchived: false,
        isFork: false,
        diff: null,
        remoteUrl: remoteInfo?.url ?? null,
        hasStaleRemote: false,
        expectedRemoteUrl: null,
        whatsNext: local.whatsNextContent ?? null,
      });
    }
  }

  // Sort: active first, then recent, stale, abandoned
  const statusOrder: Record<string, number> = { active: 0, recent: 1, stale: 2, paused: 3, abandoned: 4 };
  projects.sort((a, b) => statusOrder[a.computedStatus] - statusOrder[b.computedStatus]);

  const manifest: ProjectManifest = {
    generatedAt: new Date().toISOString(),
    projects,
  };

  onProgress?.({ phase: 'writing', message: 'Writing manifest...' });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const durationMs = Date.now() - startTime;
  onProgress?.({ phase: 'done', projectCount: projects.length, durationMs });

  return manifest;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const rawLocalDir = process.env.LOCAL_PROJECTS_DIR;
  const localDir = rawLocalDir?.startsWith('~') ? rawLocalDir.replace('~', homedir()) : rawLocalDir;

  // Parse --org flag from CLI args
  const orgIndex = process.argv.indexOf('--org');
  const org = orgIndex !== -1 ? process.argv[orgIndex + 1] : undefined;

  // Parse GITHUB_ORGS env var (comma-separated)
  const rawOrgs = process.env.GITHUB_ORGS;
  const orgs = rawOrgs
    ? rawOrgs.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : undefined;

  // If --org is provided and orgs array exists, merge it in
  if (org && orgs && !orgs.includes(org)) {
    orgs.push(org);
  }

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN or GITHUB_USERNAME in environment');
    process.exit(1);
  }

  const targets = [username];
  if (orgs?.length) targets.push(...orgs.map(o => `org:${o}`));
  else if (org) targets.push(`org:${org}`);
  console.log(`Scanning repos for: ${targets.join(', ')}...`);

  const manifest = await runScan({
    token,
    username,
    localDir,
    org: orgs ? undefined : org,
    orgs,
    onProgress: (event) => {
      switch (event.phase) {
        case 'fetching':
          if (event.current % 10 === 0 || event.current === 1) {
            console.log(`  Fetching ${event.current}/${event.total}: ${event.repoName}`);
          }
          break;
        case 'enriching':
          if (event.current % 5 === 0 || event.current === 1) {
            console.log(`  Enriching ${event.current}/${event.total}: ${event.repoName}`);
          }
          break;
        case 'writing':
          console.log(event.message);
          break;
        case 'done':
          console.log(`Wrote manifest with ${event.projectCount} projects to ${MANIFEST_PATH}`);
          break;
      }
    },
  });

  // Print summary
  const { projects } = manifest;
  const counts = projects.reduce((acc, p) => {
    acc[p.computedStatus] = (acc[p.computedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nStatus breakdown:');
  for (const [status, count] of Object.entries(counts)) {
    console.log(`  ${status}: ${count}`);
  }

  // Print source breakdown
  const sourceBreakdown = {
    'local-only': projects.filter(p => p.source === 'local-only').length,
    'remote-only': projects.filter(p => p.source === 'remote-only').length,
    synced: projects.filter(p => p.source === 'synced').length,
    'has-remote': projects.filter(p => p.source === 'has-remote').length,
  };

  console.log('\nSource breakdown:');
  console.log(`  Local only: ${sourceBreakdown['local-only']}`);
  console.log(`  Remote only: ${sourceBreakdown['remote-only']}`);
  console.log(`  Synced: ${sourceBreakdown.synced}`);
  if (sourceBreakdown['has-remote'] > 0) {
    console.log(`  Has remote: ${sourceBreakdown['has-remote']}`);
  }

  // Log fork count
  const forkCount = projects.filter(p => p.isFork).length;
  if (forkCount > 0) {
    console.log(`\nFound ${forkCount} forks`);
  }

  // Warn about stale remotes
  const staleRemotes = projects.filter(p => p.hasStaleRemote);
  if (staleRemotes.length > 0) {
    console.log(`\n⚠ ${staleRemotes.length} project(s) with stale git remotes:`);
    for (const p of staleRemotes) {
      console.log(`  ${p.name}: ${p.remoteUrl} → ${p.expectedRemoteUrl}`);
      if (p.path) {
        console.log(`    Fix: cd ${p.path} && git remote set-url origin ${p.expectedRemoteUrl}`);
      }
    }
  }
}

// Only run main() when this file is executed directly (not imported)
const isDirectRun = process.argv[1] &&
  (process.argv[1].endsWith('scanner/index.ts') || process.argv[1].endsWith('scanner/index.js'));

if (isDirectRun) {
  main().catch(err => {
    console.error('Scanner failed:', err);
    process.exit(1);
  });
}
