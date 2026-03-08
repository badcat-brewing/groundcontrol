import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSyncAction, buildWorkList } from '../sync';
import { parseOverridesSetArgs } from '../cli';
import { loadOverrides, saveOverrides, updateOverride } from '../overrides';
import { readFileSync, writeFileSync } from 'fs';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);

describe('sync action validation', () => {
  it('accepts valid actions', () => {
    expect(validateSyncAction('clone')).toBe(true);
    expect(validateSyncAction('pull')).toBe(true);
    expect(validateSyncAction('both')).toBe(true);
  });

  it('rejects invalid actions', () => {
    expect(validateSyncAction('push')).toBe(false);
    expect(validateSyncAction('')).toBe(false);
    expect(validateSyncAction('delete')).toBe(false);
  });
});

describe('buildWorkList', () => {
  const projects = [
    { name: 'remote-only', path: null, githubUrl: 'https://github.com/user/remote-only' },
    { name: 'local-only', path: '/home/user/local-only', githubUrl: null },
    { name: 'synced', path: '/home/user/synced', githubUrl: 'https://github.com/user/synced' },
  ];

  it('builds clone-only work list', () => {
    const work = buildWorkList(projects, 'clone');
    expect(work).toHaveLength(1);
    expect(work[0].op).toBe('clone');
    expect(work[0].name).toBe('remote-only');
  });

  it('builds pull-only work list', () => {
    const work = buildWorkList(projects, 'pull');
    expect(work).toHaveLength(2);
    expect(work.every(w => w.op === 'pull')).toBe(true);
    expect(work.map(w => w.name)).toEqual(['local-only', 'synced']);
  });

  it('builds both work list', () => {
    const work = buildWorkList(projects, 'both');
    expect(work).toHaveLength(3);
    expect(work[0]).toEqual({ name: 'remote-only', githubUrl: 'https://github.com/user/remote-only', op: 'clone' });
    expect(work[1]).toEqual({ name: 'local-only', path: '/home/user/local-only', op: 'pull' });
    expect(work[2]).toEqual({ name: 'synced', path: '/home/user/synced', op: 'pull' });
  });

  it('returns empty list when no matching projects', () => {
    const localOnly = [{ name: 'local', path: '/path', githubUrl: null }];
    expect(buildWorkList(localOnly, 'clone')).toHaveLength(0);
  });
});

describe('parseOverridesSetArgs', () => {
  it('returns null for empty args', () => {
    expect(parseOverridesSetArgs([])).toBeNull();
  });

  it('parses project name only', () => {
    const result = parseOverridesSetArgs(['myproject']);
    expect(result).toEqual({ project: 'myproject', tags: [], status: undefined, notes: undefined });
  });

  it('parses all flags', () => {
    const result = parseOverridesSetArgs([
      'myproject', '--tag', 'web', '--tag', 'api', '--status', 'paused', '--notes', 'on hold',
    ]);
    expect(result).toEqual({
      project: 'myproject',
      tags: ['web', 'api'],
      status: 'paused',
      notes: 'on hold',
    });
  });

  it('parses single tag', () => {
    const result = parseOverridesSetArgs(['myproject', '--tag', 'frontend']);
    expect(result!.tags).toEqual(['frontend']);
  });

  it('parses status only', () => {
    const result = parseOverridesSetArgs(['myproject', '--status', 'active']);
    expect(result!.status).toBe('active');
    expect(result!.tags).toEqual([]);
    expect(result!.notes).toBeUndefined();
  });

  it('parses notes only', () => {
    const result = parseOverridesSetArgs(['myproject', '--notes', 'testing this']);
    expect(result!.notes).toBe('testing this');
  });
});

describe('overrides module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadOverrides returns empty object on error', () => {
    mockedReadFileSync.mockImplementation(() => { throw new Error('not found'); });
    expect(loadOverrides()).toEqual({});
  });

  it('loadOverrides parses JSON file', () => {
    mockedReadFileSync.mockReturnValue(JSON.stringify({ myproject: { status: 'active' } }));
    expect(loadOverrides()).toEqual({ myproject: { status: 'active' } });
  });

  it('saveOverrides writes JSON', () => {
    const overrides = { myproject: { status: 'paused' as const, tags: ['test'] } };
    saveOverrides(overrides);
    expect(mockedWriteFileSync).toHaveBeenCalledOnce();
    const writtenJson = (mockedWriteFileSync.mock.calls[0] as [string, string])[1];
    expect(JSON.parse(writtenJson)).toEqual(overrides);
  });

  it('updateOverride merges updates', () => {
    mockedReadFileSync.mockReturnValue(JSON.stringify({ myproject: { status: 'active', tags: ['old'] } }));
    const result = updateOverride('myproject', { status: 'paused', notes: 'note' });
    expect(result.myproject).toEqual({ status: 'paused', tags: ['old'], notes: 'note' });
    expect(mockedWriteFileSync).toHaveBeenCalledOnce();
  });

  it('updateOverride creates new project entry', () => {
    mockedReadFileSync.mockReturnValue(JSON.stringify({}));
    const result = updateOverride('newproject', { tags: ['web'] });
    expect(result.newproject).toEqual({ tags: ['web'] });
  });
});
