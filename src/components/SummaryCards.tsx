import { Project } from '../../scanner/types';

interface SummaryCardsProps {
  projects: Project[];
}

const cards = [
  { label: 'Total', key: 'total', bg: 'bg-gray-100', text: 'text-gray-800' },
  { label: 'Active', key: 'active', bg: 'bg-green-100', text: 'text-green-800' },
  { label: 'Recent', key: 'recent', bg: 'bg-blue-100', text: 'text-blue-800' },
  { label: 'Stale', key: 'stale', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { label: 'Abandoned', key: 'abandoned', bg: 'bg-red-100', text: 'text-red-800' },
  { label: 'Paused', key: 'paused', bg: 'bg-purple-100', text: 'text-purple-800' },
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-lg p-4 ${card.bg} ${card.text}`}
        >
          <p className="text-sm font-medium">{card.label}</p>
          <p className="text-2xl font-bold">{counts[card.key]}</p>
        </div>
      ))}
    </div>
  );
}
