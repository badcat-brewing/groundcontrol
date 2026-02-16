import { ProjectSource } from '../../scanner/types';

const bgStyles: Record<ProjectSource, string> = {
  'local-only': 'bg-slate-100',
  'remote-only': 'bg-sky-100',
  synced: 'bg-emerald-100',
};

const textStyles: Record<ProjectSource, string> = {
  'local-only': 'text-slate-600',
  'remote-only': 'text-sky-600',
  synced: 'text-emerald-600',
};

const labels: Record<ProjectSource, string> = {
  'local-only': 'Local',
  'remote-only': 'Remote',
  synced: 'Synced',
};

function getIcon(source: ProjectSource) {
  switch (source) {
    case 'local-only':
      return (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2zm2 2a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm2 4a1 1 0 11-2 0 1 1 0 012 0zM6 8a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      );
    case 'remote-only':
      return (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a1 1 0 011 1v3h3.586a1 1 0 01.707 1.707l-4.999 5a1 1 0 01-1.414 0l-5-5A1 1 0 012.414 5H6V2a1 1 0 011-1z" />
        </svg>
      );
    case 'synced':
      return (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.5 2a.5.5 0 01.5-.5h5a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h5a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h5a.5.5 0 010 1H2.5a.5.5 0 01-.5-.5zM14 8a1 1 0 011 1v4a2 2 0 01-2 2H9.5a.5.5 0 010-1H13a1 1 0 001-1V9a1 1 0 01-1-1z" />
        </svg>
      );
  }
}

export default function SourceBadge({ source }: { source: ProjectSource }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bgStyles[source]} ${textStyles[source]}`}
    >
      {getIcon(source)}
      {labels[source]}
    </span>
  );
}
