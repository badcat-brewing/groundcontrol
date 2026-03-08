import { execFileSync } from 'child_process';

export interface GitRemoteInfo {
  url: string;
  owner: string;
  repo: string;
}

export function parseGitRemoteUrl(url: string): GitRemoteInfo | null {
  if (!url) return null;

  // HTTPS: https://github.com/owner/repo.git or https://github.com/owner/repo
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) {
    return { url, owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH: git@github.com:owner/repo.git
  const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) {
    return { url, owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

export function getGitRemoteUrl(projectDir: string): GitRemoteInfo | null {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return parseGitRemoteUrl(url);
  } catch {
    return null;
  }
}
