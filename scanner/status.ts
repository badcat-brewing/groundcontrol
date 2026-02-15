import { ProjectStatus } from './types';

const DAY_MS = 86_400_000;

export function computeStatus(
  lastCommitDate: string | null,
  now: Date = new Date()
): ProjectStatus {
  if (!lastCommitDate) return 'abandoned';

  const daysSince = (now.getTime() - new Date(lastCommitDate).getTime()) / DAY_MS;

  if (daysSince <= 7) return 'active';
  if (daysSince <= 30) return 'recent';
  if (daysSince <= 90) return 'stale';
  return 'abandoned';
}
