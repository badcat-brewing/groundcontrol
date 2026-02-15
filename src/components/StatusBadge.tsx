import { ProjectStatus } from '../../scanner/types';

const colorMap: Record<ProjectStatus, string> = {
  active: 'bg-green-100 text-green-800',
  recent: 'bg-blue-100 text-blue-800',
  stale: 'bg-yellow-100 text-yellow-800',
  abandoned: 'bg-red-100 text-red-800',
  paused: 'bg-purple-100 text-purple-800',
};

interface StatusBadgeProps {
  status: ProjectStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colorMap[status]}`}
    >
      {status}
    </span>
  );
}
