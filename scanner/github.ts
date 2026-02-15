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

    const [branches, pulls, commits] = await Promise.all([
      octokit.rest.repos.listBranches({ owner: username, repo: repo.name, per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.rest.pulls.list({ owner: username, repo: repo.name, state: 'open', per_page: 100 })
        .then(r => r.data.length).catch(() => 0),
      octokit.rest.repos.getCommitActivityStats({ owner: username, repo: repo.name })
        .then(r => {
          if (!Array.isArray(r.data)) return 0;
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
