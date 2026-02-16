'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import SourceBadge from './SourceBadge';
import { Project, ProjectStatus, ProjectSource } from '../../scanner/types';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count > 0) return `${count}${label} ago`;
  }
  return 'just now';
}

type SortKey = 'name' | 'status' | 'lastCommitDate';
type SortDir = 'asc' | 'desc';

interface ProjectTableProps {
  projects: Project[];
}

export default function ProjectTable({ projects }: ProjectTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ProjectSource | 'all'>('all');
  const [search, setSearch] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const filtered = useMemo(() => {
    let result = projects;

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.computedStatus === statusFilter);
    }

    if (sourceFilter !== 'all') {
      result = result.filter((p) => p.source === sourceFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.computedStatus.localeCompare(b.computedStatus);
          break;
        case 'lastCommitDate':
          cmp =
            (a.lastCommitDate ?? '').localeCompare(b.lastCommitDate ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [projects, statusFilter, sourceFilter, search, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProjectStatus | 'all')
          }
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="recent">Recent</option>
          <option value="stale">Stale</option>
          <option value="abandoned">Abandoned</option>
          <option value="paused">Paused</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) =>
            setSourceFilter(e.target.value as ProjectSource | 'all')
          }
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
        >
          <option value="all">All sources</option>
          <option value="local-only">Local only</option>
          <option value="remote-only">Remote only</option>
          <option value="synced">Synced</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs font-medium uppercase tracking-wider text-slate-400">
            <tr>
              <th
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSort('name')}
              >
                Name{sortIndicator('name')}
              </th>
              <th className="px-3 py-2">Source</th>
              <th
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSort('status')}
              >
                Status{sortIndicator('status')}
              </th>
              <th
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSort('lastCommitDate')}
              >
                Last Commit{sortIndicator('lastCommitDate')}
              </th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Tech Stack</th>
              <th className="px-3 py-2">Capabilities</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.name} className="hover:bg-sky-50/50 even:bg-slate-50/30">
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`/projects/${encodeURIComponent(project.name)}`}
                    className="text-sky-600 hover:text-sky-700"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <SourceBadge source={project.source} />
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={project.computedStatus} />
                </td>
                <td className="px-3 py-2 font-mono text-slate-500">
                  {project.lastCommitDate
                    ? timeAgo(project.lastCommitDate)
                    : 'N/A'}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-slate-500">
                  {project.description ?? '-'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-indigo-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {project.capabilities.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-teal-600"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
