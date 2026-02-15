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
