import { ProjectSource } from '../../scanner/types';

const bgStyles: Record<ProjectSource | 'unknown', string> = {
  'local-only': 'bg-slate-100',
  'remote-only': 'bg-sky-100',
  synced: 'bg-emerald-100',
  'has-remote': 'bg-violet-100',
  unknown: 'bg-gray-100',
};

const textStyles: Record<ProjectSource | 'unknown', string> = {
  'local-only': 'text-slate-600',
  'remote-only': 'text-sky-600',
  synced: 'text-emerald-600',
  'has-remote': 'text-violet-600',
  unknown: 'text-gray-600',
};

const labels: Record<ProjectSource | 'unknown', string> = {
  'local-only': 'Local',
  'remote-only': 'Remote',
  synced: 'Synced',
  'has-remote': 'Has Remote',
  unknown: 'Unknown',
};

function getIcon(source: ProjectSource | 'unknown') {
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
    case 'has-remote':
      return (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.715 6.542L3.343 7.914a3 3 0 104.243 4.243l1.828-1.829A3 3 0 008.586 5.5L8 6.086a1.002 1.002 0 00-.154.199 2 2 0 01.861 3.337L6.88 11.45a2 2 0 11-2.83-2.83l.793-.792a4.018 4.018 0 01-.128-1.287z" />
          <path d="M11.285 9.458l1.372-1.372a3 3 0 10-4.243-4.243L6.586 5.671A3 3 0 007.414 10.5l.586-.586a1.002 1.002 0 00.154-.199 2 2 0 01-.861-3.337L9.12 4.55a2 2 0 112.83 2.83l-.793.792c.112.42.155.855.128 1.287z" />
        </svg>
      );
    case 'unknown':
    default:
      return (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 100 8a7 7 0 008 7zm0 1A8 8 0 108 0a8 8 0 000 16z" />
        </svg>
      );
  }
}

export default function SourceBadge({ source }: { source: ProjectSource | undefined | null }) {
  const displaySource = (source as ProjectSource | 'unknown') || 'unknown';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bgStyles[displaySource]} ${textStyles[displaySource]}`}
    >
      {getIcon(displaySource)}
      {labels[displaySource]}
    </span>
  );
}
