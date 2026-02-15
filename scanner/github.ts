import { Octokit } from '@octokit/rest';

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

  // Paginate manually since @octokit/rest doesn't bundle paginate
  const allRepos: Array<{ name: string; html_url: string; default_branch: string; pushed_at: string | null }> = [];
  let page = 1;
  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'pushed',
      affiliation: 'owner',
      page,
    });
    if (data.length === 0) break;
    allRepos.push(...data.map(r => ({
      name: r.name,
      html_url: r.html_url,
      default_branch: r.default_branch,
      pushed_at: r.pushed_at ?? null,
    })));
    if (data.length < 100) break;
    page++;
  }

  console.log(`Fetching details for ${allRepos.length} repos...`);
  const projects: PartialProject[] = [];

  for (const repo of allRepos) {
    const partial = transformRepoData(repo);

    const [branches, pulls, commits] = await Promise.all([
      octokit.repos.listBranches({ owner: username, repo: repo.name, per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.pulls.list({ owner: username, repo: repo.name, state: 'open', per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.repos.getCommitActivityStats({ owner: username, repo: repo.name })
        .then(r => {
          if (!Array.isArray(r.data)) return 0;
          return r.data.slice(-4).reduce((sum, week) => sum + week.total, 0);
        }).catch(() => 0),
    ]);

    partial.branchCount = branches;
    partial.openPRCount = pulls;
    partial.commitCountLast30Days = commits;

    projects.push(partial);
    if (projects.length % 10 === 0) console.log(`  ...processed ${projects.length}/${allRepos.length}`);
  }

  return projects;
}
