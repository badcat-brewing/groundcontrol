export type ProjectStatus = 'active' | 'recent' | 'stale' | 'abandoned' | 'paused';

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
