import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeLocalRemoteDiff } from '../diff';
import * as childProcess from 'child_process';

vi.mock('child_process');

describe('computeLocalRemoteDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes diff for a synced repo with commits ahead and behind', async () => {
    const execFileSync = vi.spyOn(childProcess, 'execFileSync');

    execFileSync.mockImplementation((cmd: string, args?: readonly string[], options?: any) => {
      const argStr = (args || []).join(' ');
      if (argStr.includes('rev-parse')) return 'main';
      if (argStr.includes('fetch')) return '';
      if (argStr.includes('rev-list')) return '2\t1';
      if (argStr.includes('status')) return '';
      if (argStr.includes('branch')) return 'main\ndev\nfeature/test\n';
      return '';
    });

    const result = await computeLocalRemoteDiff('/path/to/repo', ['main', 'develop'], 'main');

    expect(result.localBranch).toBe('main');
    expect(result.remoteBranch).toBe('main');
    expect(result.aheadCount).toBe(2);
    expect(result.behindCount).toBe(1);
    expect(result.hasUncommittedChanges).toBe(false);
    expect(result.localOnlyBranches).toContain('dev');
    expect(result.localOnlyBranches).toContain('feature/test');
    expect(result.remoteOnlyBranches).toContain('develop');
  });

  it('detects uncommitted changes', async () => {
    const execFileSync = vi.spyOn(childProcess, 'execFileSync');

    execFileSync.mockImplementation((cmd: string, args?: readonly string[], options?: any) => {
      const argStr = (args || []).join(' ');
      if (argStr.includes('rev-parse')) return 'main';
      if (argStr.includes('fetch')) return '';
      if (argStr.includes('rev-list')) return '0\t0';
      if (argStr.includes('status')) return 'M src/index.ts\n?? dist/';
      if (argStr.includes('branch')) return 'main\n';
      return '';
    });

    const result = await computeLocalRemoteDiff('/path/to/repo', ['main'], 'main');

    expect(result.hasUncommittedChanges).toBe(true);
  });

  it('handles fetch failure gracefully (no remote)', async () => {
    const execFileSync = vi.spyOn(childProcess, 'execFileSync');

    execFileSync.mockImplementation((cmd: string, args?: readonly string[], options?: any) => {
      const argStr = (args || []).join(' ');
      if (argStr.includes('rev-parse')) return 'main';
      if (argStr.includes('fetch')) throw new Error('fatal: No remote named origin');
      // After failed fetch, other commands return safe defaults
      if (argStr.includes('rev-list')) throw new Error('invalid ref');
      if (argStr.includes('status')) throw new Error('not a git repo');
      if (argStr.includes('branch')) throw new Error('not a git repo');
      return '';
    });

    const result = await computeLocalRemoteDiff('/path/to/repo', [], 'main');

    // Should return safe defaults
    expect(result.aheadCount).toBe(0);
    expect(result.behindCount).toBe(0);
    expect(result.hasUncommittedChanges).toBe(false);
  });

  it('returns safe defaults on git command failure', async () => {
    const execFileSync = vi.spyOn(childProcess, 'execFileSync');

    execFileSync.mockImplementation(() => {
      throw new Error('command failed');
    });

    const result = await computeLocalRemoteDiff('/invalid/path', ['main'], 'main');

    expect(result.localBranch).toBe('unknown');
    expect(result.remoteBranch).toBe('main');
    expect(result.aheadCount).toBe(0);
    expect(result.behindCount).toBe(0);
    expect(result.hasUncommittedChanges).toBe(false);
    expect(result.localOnlyBranches).toEqual([]);
    expect(result.remoteOnlyBranches).toEqual([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
