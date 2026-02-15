import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { OverlapMap } from '../lib/overlaps';

interface OverlapGridProps {
  overlaps: OverlapMap;
}

export default function OverlapGrid({ overlaps }: OverlapGridProps) {
  const sorted = Object.entries(overlaps).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No capability overlaps detected.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map(([capability, projects]) => (
        <div
          key={capability}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-sm font-semibold text-slate-900">
              {capability}
            </h3>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="font-mono text-xs font-medium text-slate-600">
                {projects.length}
              </span>
            </span>
          </div>
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.name} className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.name}`}
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  {project.name}
                </Link>
                <StatusBadge status={project.computedStatus} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
