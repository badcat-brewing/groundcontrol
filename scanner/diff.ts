import { execFileSync } from 'child_process';
import { LocalRemoteDiff } from './types';

function safeExec(command: string, args: string[], cwd: string, description: string): string {
  try {
    return execFileSync(command, args, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    console.warn(`  [diff] Failed to ${description}: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

export async function computeLocalRemoteDiff(
  localPath: string,
  remoteBranches: string[],
  defaultBranch: string
): Promise<LocalRemoteDiff> {
  // Default/safe response
  const safeDefault: LocalRemoteDiff = {
    localBranch: 'unknown',
    remoteBranch: defaultBranch,
    aheadCount: 0,
    behindCount: 0,
    hasUncommittedChanges: false,
    localOnlyBranches: [],
    remoteOnlyBranches: [],
  };

  try {
    // Step 1: Get current local branch
    const localBranch = safeExec('git', ['-C', localPath, 'rev-parse', '--abbrev-ref', 'HEAD'], localPath, 'get local branch');
    if (!localBranch) return safeDefault;

    // Step 2: Fetch latest remote state
    safeExec('git', ['-C', localPath, 'fetch', 'origin', '--quiet'], localPath, 'fetch origin');

    // Step 3: Get ahead/behind counts
    const aheadBehindOutput = safeExec(
      'git',
      ['-C', localPath, 'rev-list', '--left-right', '--count', `HEAD...origin/${defaultBranch}`],
      localPath,
      'count commits ahead/behind'
    );
    let aheadCount = 0;
    let behindCount = 0;
    if (aheadBehindOutput) {
      const parts = aheadBehindOutput.split('\t');
      aheadCount = parseInt(parts[0] || '0', 10);
      behindCount = parseInt(parts[1] || '0', 10);
    }

    // Step 4: Check for uncommitted changes
    const statusOutput = safeExec('git', ['-C', localPath, 'status', '--porcelain'], localPath, 'check git status');
    const hasUncommittedChanges = statusOutput.length > 0;

    // Step 5: Get local branches
    const localBranchesOutput = safeExec(
      'git',
      ['-C', localPath, 'branch', '--format=%(refname:short)'],
      localPath,
      'list local branches'
    );
    const localBranchesArray = localBranchesOutput
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    // Step 6: Compare local vs remote branches
    const remoteBranchesSet = new Set(remoteBranches);
    const localOnlyBranches = localBranchesArray.filter(b => !remoteBranchesSet.has(b));
    const remoteOnlyBranches = remoteBranches.filter(b => !localBranchesArray.includes(b));

    return {
      localBranch,
      remoteBranch: defaultBranch,
      aheadCount,
      behindCount,
      hasUncommittedChanges,
      localOnlyBranches,
      remoteOnlyBranches,
    };
  } catch (error) {
    console.warn(`  [diff] Unexpected error computing diff: ${error instanceof Error ? error.message : String(error)}`);
    return safeDefault;
  }
}
