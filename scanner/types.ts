export type ProjectStatus = 'active' | 'recent' | 'stale' | 'abandoned' | 'paused';
export type ProjectSource = 'local-only' | 'remote-only' | 'synced';

export interface LocalRemoteDiff {
  localBranch: string;
  remoteBranch: string;
  aheadCount: number;
  behindCount: number;
  hasUncommittedChanges: boolean;
  localOnlyBranches: string[];
  remoteOnlyBranches: string[];
}

export interface Project {
  name: string;
  path: string | null;
  githubUrl: string | null;

  lastCommitDate: string | null;
  commitCountLast30Days: number;
  openPRCount: number;
  defaultBranch: string;
  branchCount: number;

  hasClaude: boolean;
  hasReadme: boolean;
  hasPlanDocs: boolean;
  hasTodos: boolean;

  description: string | null;
  techStack: string[];
  capabilities: string[];

  tags: string[];
  status: ProjectStatus | null;
  notes: string | null;

  computedStatus: ProjectStatus;

  source: ProjectSource;
  visibility: 'public' | 'private' | null;
  languages: Record<string, number>;
  topics: string[];
  license: string | null;
  sizeKB: number;
  isArchived: boolean;
  isFork: boolean;
  diff: LocalRemoteDiff | null;
}

export interface ProjectManifest {
  generatedAt: string;
  projects: Project[];
}

export interface Overrides {
  [projectName: string]: {
    tags?: string[];
    status?: ProjectStatus;
    notes?: string;
  };
}
