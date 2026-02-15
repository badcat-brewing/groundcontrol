'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { Project, ProjectStatus } from '../../scanner/types';

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
  }, [projects, statusFilter, search, sortKey, sortDir]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProjectStatus | 'all')
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="recent">Recent</option>
          <option value="stale">Stale</option>
          <option value="abandoned">Abandoned</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSort('name')}
              >
                Name{sortIndicator('name')}
              </th>
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
          <tbody className="divide-y divide-gray-100">
            {filtered.map((project) => (
              <tr key={project.name} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`/projects/${encodeURIComponent(project.name)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={project.computedStatus} />
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {project.lastCommitDate
                    ? timeAgo(project.lastCommitDate)
                    : 'N/A'}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-gray-500">
                  {project.description ?? '-'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {project.techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {project.capabilities.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
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
                  colSpan={6}
                  className="px-3 py-8 text-center text-gray-400"
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
