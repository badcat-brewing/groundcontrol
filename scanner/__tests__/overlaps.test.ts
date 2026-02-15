import { describe, it, expect } from 'vitest';
import { findOverlaps } from '../../src/lib/overlaps';
import { Project, ProjectStatus } from '../types';

function makeProject(name: string, capabilities: string[]): Project {
  return {
    name, capabilities, path: null, githubUrl: null, lastCommitDate: null,
    commitCountLast30Days: 0, openPRCount: 0, defaultBranch: 'main', branchCount: 1,
    hasClaude: false, hasReadme: false, hasPlanDocs: false, hasTodos: false,
    description: null, techStack: [], tags: [], status: null, notes: null,
    computedStatus: 'active' as ProjectStatus,
  };
}

describe('findOverlaps', () => {
  it('groups projects sharing a capability', () => {
    const projects = [
      makeProject('email-forwarder', ['email-sending']),
      makeProject('letter-rip', ['email-sending', 'api-server']),
      makeProject('photo-app', ['file-storage']),
    ];
    const overlaps = findOverlaps(projects);
    expect(overlaps['email-sending']).toHaveLength(2);
    expect(overlaps['email-sending'].map(p => p.name)).toContain('email-forwarder');
    expect(overlaps['email-sending'].map(p => p.name)).toContain('letter-rip');
  });

  it('excludes capabilities with only one project', () => {
    const projects = [
      makeProject('solo', ['file-storage']),
    ];
    const overlaps = findOverlaps(projects);
    expect(overlaps['file-storage']).toBeUndefined();
  });

  it('returns empty object when no overlaps exist', () => {
    const projects = [
      makeProject('a', ['email-sending']),
      makeProject('b', ['file-storage']),
    ];
    const overlaps = findOverlaps(projects);
    expect(Object.keys(overlaps)).toHaveLength(0);
  });
});
