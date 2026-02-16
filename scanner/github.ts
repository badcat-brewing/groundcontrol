import { Octokit } from '@octokit/rest';

export interface PartialProject {
  name: string;
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

export function transformRepoData(repo: any): PartialProject {
  const visibility = repo.visibility ? repo.visibility : (repo.private ? 'private' : 'public');
  return {
    name: repo.name,
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
  } catch {
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

export async function fetchAllRepos(token: string, username: string, org?: string): Promise<FetchResult> {
  const noop = () => {};
  const octokit = new Octokit({ auth: token, log: { debug: noop, info: noop, warn: noop, error: noop } });
  const owner = org || username;

  // Paginate manually since @octokit/rest doesn't bundle paginate
  const allRepos: any[] = [];
  let page = 1;
  while (true) {
    const { data } = org
      ? await octokit.repos.listForOrg({ org, per_page: 100, sort: 'pushed', page })
      : await octokit.repos.listForAuthenticatedUser({ per_page: 100, sort: 'pushed', affiliation: 'owner', page });
    if (data.length === 0) break;
    allRepos.push(...data);
    if (data.length < 100) break;
    page++;
  }

  console.log(`Fetching details for ${allRepos.length} repos...`);
  const projects: PartialProject[] = [];

  for (const repo of allRepos) {
    const partial = transformRepoData(repo);

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
