import { ProjectStatus } from '../../scanner/types';

const dotStyles: Record<ProjectStatus, string> = {
  active: 'bg-emerald-400',
  recent: 'bg-sky-400',
  stale: 'bg-amber-400',
  abandoned: 'border border-rose-400 bg-transparent',
  paused: 'bg-violet-400',
};

const textStyles: Record<ProjectStatus, string> = {
  active: 'text-emerald-700',
  recent: 'text-sky-700',
  stale: 'text-amber-700',
  abandoned: 'text-rose-600',
  paused: 'text-violet-700',
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotStyles[status]}`} />
      <span className={`text-xs font-medium ${textStyles[status]}`}>{status}</span>
    </span>
  );
}
