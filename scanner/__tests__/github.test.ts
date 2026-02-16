import { describe, it, expect } from 'vitest';
import { transformRepoData } from '../github';

describe('transformRepoData', () => {
  it('transforms GitHub API repo response to partial Project', () => {
    const repo = {
      name: 'my-project',
      html_url: 'https://github.com/user/my-project',
      default_branch: 'main',
      pushed_at: '2026-02-10T00:00:00Z',
      private: false,
      archived: false,
      fork: false,
      size: 1024,
      license: { spdx_id: 'MIT' },
      topics: ['javascript'],
    };
    const result = transformRepoData(repo);
    expect(result.name).toBe('my-project');
    expect(result.githubUrl).toBe('https://github.com/user/my-project');
    expect(result.defaultBranch).toBe('main');
    expect(result.lastCommitDate).toBe('2026-02-10T00:00:00Z');
    expect(result.visibility).toBe('public');
    expect(result.sizeKB).toBe(1024);
    expect(result.isArchived).toBe(false);
    expect(result.isFork).toBe(false);
    expect(result.license).toBe('MIT');
    expect(result.topics).toEqual(['javascript']);
  });

  it('handles null pushed_at', () => {
    const repo = {
      name: 'empty-repo',
      html_url: 'https://github.com/user/empty-repo',
      default_branch: 'main',
      pushed_at: null,
      private: false,
      archived: false,
      fork: false,
      size: 0,
      license: null,
      topics: [],
    };
    const result = transformRepoData(repo);
    expect(result.lastCommitDate).toBeNull();
  });
});
