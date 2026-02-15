import StatusBadge from './StatusBadge';
import { Project } from '../../scanner/types';
import { timeAgo } from '@/lib/utils';

interface ProjectDetailProps {
  project: Project;
}

function DocIndicator({ label, has }: { label: string; has: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      {has ? (
        <span className="text-sm font-medium text-green-600">Yes</span>
      ) : (
        <span className="text-sm font-medium text-gray-400">No</span>
      )}
    </div>
  );
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <StatusBadge status={project.computedStatus} />
        </div>
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on GitHub
          </a>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Description
          </h2>
          <p className="text-gray-700">{project.description}</p>
        </div>
      )}

      {/* Where I Left Off */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
          Where I Left Off
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Last Commit</p>
            {project.lastCommitDate ? (
              <>
                <p className="text-lg font-semibold text-gray-900">
                  {timeAgo(project.lastCommitDate)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(project.lastCommitDate).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold text-gray-400">N/A</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Commits (30d)</p>
            <p className="text-lg font-semibold text-gray-900">
              {project.commitCountLast30Days}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Open PRs</p>
            <p className="text-lg font-semibold text-gray-900">
              {project.openPRCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Branches</p>
            <p className="text-lg font-semibold text-gray-900">
              {project.branchCount}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
          Metadata
        </h2>
        <div className="space-y-4">
          {project.techStack.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-gray-500">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.capabilities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-gray-500">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {project.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-gray-500">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documentation Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
          Documentation Status
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DocIndicator label="CLAUDE.md" has={project.hasClaude} />
          <DocIndicator label="README" has={project.hasReadme} />
          <DocIndicator label="Plan Docs" has={project.hasPlanDocs} />
          <DocIndicator label="TODOs" has={project.hasTodos} />
        </div>
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-gray-700">{project.notes}</p>
        </div>
      )}

      {/* Local Path */}
      {project.path && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Local Path
          </h2>
          <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-700">
            {project.path}
          </code>
        </div>
      )}
    </div>
  );
}
