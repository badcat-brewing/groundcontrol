import { describe, it, expect } from 'vitest';
import { ProjectSource } from '../types';

function classifySource(localPath: string | null, githubUrl: string | null): ProjectSource {
  if (localPath && githubUrl) return 'synced';
  if (localPath && !githubUrl) return 'local-only';
  return 'remote-only';
}

describe('source classification', () => {
  it('classifies synced repos correctly', () => {
    const source = classifySource('/local/path', 'https://github.com/user/repo');
    expect(source).toBe('synced');
  });

  it('classifies remote-only repos correctly', () => {
    const source = classifySource(null, 'https://github.com/user/repo');
    expect(source).toBe('remote-only');
  });

  it('classifies local-only repos correctly', () => {
    const source = classifySource('/local/path', null);
    expect(source).toBe('local-only');
  });

  it('handles null for both (returns remote-only)', () => {
    const source = classifySource(null, null);
    expect(source).toBe('remote-only');
  });
});
