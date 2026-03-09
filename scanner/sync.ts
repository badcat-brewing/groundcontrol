import { execFileSync, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface SyncResult {
  name: string;
  action: 'cloned' | 'pulled' | 'skipped';
  success: boolean;
  message: string;
}

export type SyncLogger = (text: string) => void;

export function isCleanWorkingTree(repoPath: string): boolean {
  try {
    const status = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf-8' });
    return status.trim() === '';
  } catch {
    return false;
  }
}

export function cloneRepo(
  logger: SyncLogger,
  githubUrl: string,
  targetDir: string,
  index: number,
  total: number,
): SyncResult {
  const name = githubUrl.split('/').pop() || '';
  const dest = join(targetDir, name);

  if (existsSync(dest)) {
    logger(`[${index}/${total}] ${name} — already exists locally, skipping`);
    return { name, action: 'skipped', success: true, message: 'Already exists locally' };
  }

  const cloneUrl = githubUrl.endsWith('.git') ? githubUrl : `${githubUrl}.git`;
  logger(`[${index}/${total}] ${name} — cloning from ${githubUrl}...`);
  try {
    execFileSync('git', ['clone', cloneUrl, dest], { encoding: 'utf-8', timeout: 120000 });
    logger(`[${index}/${total}] ${name} — cloned successfully`);
    return { name, action: 'cloned', success: true, message: 'Cloned successfully' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const short = msg.split('\n')[0];
    logger(`[${index}/${total}] ${name} — ERROR: ${short}`);
    return { name, action: 'cloned', success: false, message: short };
  }
}

export function pullRepo(
  logger: SyncLogger,
  repoPath: string,
  name: string,
  index: number,
  total: number,
): SyncResult {
  if (!existsSync(repoPath)) {
    logger(`[${index}/${total}] ${name} — not found locally, skipping`);
    return { name, action: 'skipped', success: true, message: 'Not found locally' };
  }

  logger(`[${index}/${total}] ${name} — checking working tree...`);

  if (!isCleanWorkingTree(repoPath)) {
    logger(`[${index}/${total}] ${name} — uncommitted changes, skipping`);
    return { name, action: 'skipped', success: true, message: 'Working tree has uncommitted changes' };
  }

  logger(`[${index}/${total}] ${name} — pulling (ff-only)...`);
  try {
    const output = execSync('git pull --ff-only', { cwd: repoPath, encoding: 'utf-8', timeout: 60000 });
    const trimmed = output.trim();
    const message = trimmed.includes('Already up to date') ? 'Already up to date' : 'Pulled successfully';
    logger(`[${index}/${total}] ${name} — ${message.toLowerCase()}`);
    return { name, action: 'pulled', success: true, message };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Not possible to fast-forward')) {
      logger(`[${index}/${total}] ${name} — cannot fast-forward, skipping`);
      return { name, action: 'skipped', success: true, message: 'Cannot fast-forward, manual merge needed' };
    } else {
      const short = msg.split('\n')[0];
      logger(`[${index}/${total}] ${name} — ERROR: ${short}`);
      return { name, action: 'pulled', success: false, message: short };
    }
  }
}

export type SyncAction = 'clone' | 'pull' | 'both' | 'full';

export function validateSyncAction(action: string): action is SyncAction {
  return ['clone', 'pull', 'both', 'full'].includes(action);
}

export interface SyncWorkItem {
  name: string;
  githubUrl?: string | null;
  path?: string | null;
  op: 'clone' | 'pull';
}

export function buildWorkList(
  projects: Array<{ name: string; path: string | null; githubUrl: string | null }>,
  action: SyncAction,
): SyncWorkItem[] {
  const effectiveAction = action === 'full' ? 'both' : action;
  const work: SyncWorkItem[] = [];
  for (const project of projects) {
    if ((effectiveAction === 'clone' || effectiveAction === 'both') && !project.path && project.githubUrl) {
      work.push({ name: project.name, githubUrl: project.githubUrl, op: 'clone' });
    } else if ((effectiveAction === 'pull' || effectiveAction === 'both') && project.path) {
      work.push({ name: project.name, path: project.path, op: 'pull' });
    }
  }
  return work;
}
