import { Octokit } from '@octokit/rest';
import { execFileSync } from 'child_process';
import type { OnProgress } from './progress';

export interface PartialProject {
  name: string;
  owner: string;
  githubUrl: string;
  defaultBranch: string;
  lastCommitDate: string | null;
  branchCount: number;
  branchNames: string[];
  openPRCount: number;
  commitCountLast30Days: number;
  visibility: 'public' | 'private' | null;
  languages: Record<string, number>;
  topics: string[];
  license: string | null;
  sizeKB: number;
  isArchived: boolean;
  isFork: boolean;
}

export function transformRepoData(repo: any, owner: string): PartialProject {
  const visibility = repo.visibility ? repo.visibility : (repo.private ? 'private' : 'public');
  return {
    name: repo.name,
    owner,
    githubUrl: repo.html_url,
    defaultBranch: repo.default_branch || 'main',
    lastCommitDate: repo.pushed_at || null,
    branchCount: 0,
    branchNames: [],
    openPRCount: 0,
    commitCountLast30Days: 0,
    visibility: visibility as 'public' | 'private',
    languages: {},
    topics: repo.topics || [],
    license: repo.license?.spdx_id || null,
    sizeKB: repo.size || 0,
    isArchived: repo.archived || false,
    isFork: repo.fork || false,
  };
}

export interface RemoteProjectFiles {
  claudeContent: string | null;
  readmeContent: string | null;
  packageJson: Record<string, string> | null;
}

async function fetchFileContent(octokit: Octokit, owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if ('content' in data && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchRepoFiles(octokit: Octokit, owner: string, repo: string): Promise<RemoteProjectFiles> {
  const [claudeContent, readmeContent, packageJsonRaw] = await Promise.all([
    fetchFileContent(octokit, owner, repo, 'CLAUDE.md'),
    fetchFileContent(octokit, owner, repo, 'README.md'),
    fetchFileContent(octokit, owner, repo, 'package.json'),
  ]);

  let packageJson: Record<string, string> | null = null;
  if (packageJsonRaw) {
    try {
      const parsed = JSON.parse(packageJsonRaw);
      packageJson = { ...parsed.dependencies, ...parsed.devDependencies };
    } catch { /* ignore */ }
  }

  return { claudeContent, readmeContent, packageJson };
}

export async function fetchRepoLanguages(octokit: Octokit, owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const { data } = await octokit.repos.listLanguages({ owner, repo });
    return data as Record<string, number>;
  } catch (error) {
    // Archived repos may return 403, empty repos may fail — return empty map gracefully
    return {};
  }
}

export async function fetchBranchNames(octokit: Octokit, owner: string, repo: string): Promise<string[]> {
  try {
    const { data } = await octokit.repos.listBranches({ owner, repo, per_page: 100 });
    return data.map(b => b.name);
  } catch {
    return [];
  }
}

export interface FetchResult {
  projects: PartialProject[];
  octokit: Octokit;
  owner: string;
}

export async function fetchAllRepos(token: string, username: string, org?: string, onProgress?: OnProgress): Promise<FetchResult> {
  const noop = () => {};
  const octokit = new Octokit({ auth: token, log: { debug: noop, info: noop, warn: noop, error: noop } });
  const owner = org || username;

  // Paginate manually since @octokit/rest doesn't bundle paginate
  const allRepos: any[] = [];
  let page = 1;
  while (true) {
    const { data } = org
      ? await octokit.repos.listForOrg({ org, per_page: 100, sort: 'pushed', page })
      : await octokit.repos.listForAuthenticatedUser({ per_page: 100, sort: 'pushed', affiliation: 'owner,collaborator', page });
    if (data.length === 0) break;
    allRepos.push(...data);
    if (data.length < 100) break;
    page++;
  }

  console.log(`Fetching details for ${allRepos.length} repos...`);
  const projects: PartialProject[] = [];

  for (const repo of allRepos) {
    const partial = transformRepoData(repo, owner);

    onProgress?.({ phase: 'fetching', current: projects.length + 1, total: allRepos.length, repoName: repo.name });

    const [branchNames, pulls, commits, languages] = await Promise.all([
      fetchBranchNames(octokit, owner, repo.name),
      octokit.pulls.list({ owner, repo: repo.name, state: 'open', per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.repos.getCommitActivityStats({ owner, repo: repo.name })
        .then(r => {
          if (!Array.isArray(r.data)) return 0;
          return r.data.slice(-4).reduce((sum, week) => sum + week.total, 0);
        }).catch(() => 0),
      fetchRepoLanguages(octokit, owner, repo.name),
    ]);

    partial.branchCount = branchNames.length;
    partial.branchNames = branchNames;
    partial.openPRCount = pulls;
    partial.commitCountLast30Days = commits;
    partial.languages = languages;

    projects.push(partial);
    if (projects.length % 10 === 0) console.log(`  ...processed ${projects.length}/${allRepos.length}`);
  }

  return { projects, octokit, owner };
}

/**
 * Discover repos via the `gh` CLI, which often has broader auth than a fine-grained PAT.
 * Returns basic repo metadata without enrichment — intended for supplementing Octokit results.
 */
export function discoverReposViaGhCli(username: string, org?: string): PartialProject[] {
  try {
    const target = org || username;
    // Strip GITHUB_TOKEN from subprocess env so gh uses its own stored auth,
    // which typically has broader access than a fine-grained PAT
    const { GITHUB_TOKEN: _, ...cleanEnv } = process.env;
    const result = execFileSync('gh', [
      'repo', 'list', target,
      '--limit', '500',
      '--json', 'name,url,defaultBranchRef,pushedAt,visibility,isArchived,isFork,repositoryTopics,licenseInfo,diskUsage,isPrivate',
    ], { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'], env: cleanEnv });

    const repos = JSON.parse(result);
    return repos.map((r: any) => ({
      name: r.name,
      owner: target,
      githubUrl: r.url,
      defaultBranch: r.defaultBranchRef?.name || 'main',
      lastCommitDate: r.pushedAt || null,
      branchCount: 0,
      branchNames: [],
      openPRCount: 0,
      commitCountLast30Days: 0,
      visibility: r.isPrivate ? 'private' : (r.visibility?.toLowerCase() as 'public' | 'private') || 'public',
      languages: {},
      topics: (r.repositoryTopics || []).map((t: any) => t.name || t),
      license: r.licenseInfo?.spdx_id || r.licenseInfo?.key || null,
      sizeKB: r.diskUsage || 0,
      isArchived: r.isArchived || false,
      isFork: r.isFork || false,
    }));
  } catch {
    return [];
  }
}
