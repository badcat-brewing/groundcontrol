import { Project } from '../../scanner/types';

interface SummaryCardsProps {
  projects: Project[];
}

const metrics = [
  { label: 'Total', key: 'total', dot: 'bg-slate-400' },
  { label: 'Active', key: 'active', dot: 'bg-emerald-400' },
  { label: 'Recent', key: 'recent', dot: 'bg-sky-400' },
  { label: 'Stale', key: 'stale', dot: 'bg-amber-400' },
  { label: 'Abandoned', key: 'abandoned', dot: 'border border-rose-400' },
  { label: 'Paused', key: 'paused', dot: 'bg-violet-400' },
] as const;

export default function SummaryCards({ projects }: SummaryCardsProps) {
  const counts: Record<string, number> = {
    total: projects.length,
    active: projects.filter((p) => p.computedStatus === 'active').length,
    recent: projects.filter((p) => p.computedStatus === 'recent').length,
    stale: projects.filter((p) => p.computedStatus === 'stale').length,
    abandoned: projects.filter((p) => p.computedStatus === 'abandoned').length,
    paused: projects.filter((p) => p.computedStatus === 'paused').length,
  };

  return (
    <div className="flex items-center gap-6 border-b border-slate-200 pb-4">
      {metrics.map((m) => (
        <div key={m.key} className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${m.dot}`} />
          <span className="text-xs font-medium text-slate-500">{m.label}</span>
          <span className="font-mono text-sm font-semibold text-slate-900">{counts[m.key]}</span>
        </div>
      ))}
    </div>
  );
}
