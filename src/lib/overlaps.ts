import { Project } from '../../scanner/types';

export interface OverlapMap {
  [capability: string]: Project[];
}

export function findOverlaps(projects: Project[]): OverlapMap {
  const capabilityGroups: Record<string, Project[]> = {};

  for (const project of projects) {
    for (const cap of project.capabilities) {
      if (!capabilityGroups[cap]) capabilityGroups[cap] = [];
      capabilityGroups[cap].push(project);
    }
  }

  const overlaps: OverlapMap = {};
  for (const [cap, group] of Object.entries(capabilityGroups)) {
    if (group.length >= 2) {
      overlaps[cap] = group;
    }
  }

  return overlaps;
}
