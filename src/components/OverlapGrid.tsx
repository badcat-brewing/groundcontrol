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
        <p className="text-gray-500">No capability overlaps detected.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map(([capability, projects]) => (
        <div
          key={capability}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {capability}
            </h3>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
              {projects.length} projects
            </span>
          </div>
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.name} className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.name}`}
                  className="text-sm text-blue-600 hover:underline"
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
