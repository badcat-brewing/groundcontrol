import { describe, it, expect } from 'vitest';
import { parseGitRemoteUrl } from '../remote-detect';

describe('parseGitRemoteUrl', () => {
  it('parses HTTPS GitHub URL', () => {
    const result = parseGitRemoteUrl('https://github.com/badcat-brewing/groundcontrol.git');
    expect(result).toEqual({ url: 'https://github.com/badcat-brewing/groundcontrol.git', owner: 'badcat-brewing', repo: 'groundcontrol' });
  });

  it('parses HTTPS GitHub URL without .git suffix', () => {
    const result = parseGitRemoteUrl('https://github.com/badcat-brewing/groundcontrol');
    expect(result).toEqual({ url: 'https://github.com/badcat-brewing/groundcontrol', owner: 'badcat-brewing', repo: 'groundcontrol' });
  });

  it('parses SSH GitHub URL', () => {
    const result = parseGitRemoteUrl('git@github.com:badcat-brewing/groundcontrol.git');
    expect(result).toEqual({ url: 'git@github.com:badcat-brewing/groundcontrol.git', owner: 'badcat-brewing', repo: 'groundcontrol' });
  });

  it('returns null for non-GitHub URL', () => {
    const result = parseGitRemoteUrl('https://gitlab.com/user/repo.git');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseGitRemoteUrl('');
    expect(result).toBeNull();
  });
});
