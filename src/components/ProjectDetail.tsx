import StatusBadge from './StatusBadge';
import ProjectEditor from './ProjectEditor';
import { Project } from '../../scanner/types';
import { timeAgo } from '@/lib/utils';

interface ProjectDetailProps {
  project: Project;
}

function DocIndicator({ label, has }: { label: string; has: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      {has ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-700">Yes</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="text-xs font-medium text-slate-400">No</span>
        </span>
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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          <StatusBadge status={project.computedStatus} />
        </div>
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700"
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
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Description
          </h2>
          <p className="text-slate-700">{project.description}</p>
        </div>
      )}

      {/* Where I Left Off */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Where I Left Off
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Commit</p>
            {project.lastCommitDate ? (
              <>
                <p className="font-mono text-lg font-semibold text-slate-900">
                  {timeAgo(project.lastCommitDate)}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {new Date(project.lastCommitDate).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="font-mono text-lg font-semibold text-slate-400">N/A</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Commits (30d)</p>
            <p className="font-mono text-lg font-semibold text-slate-900">
              {project.commitCountLast30Days}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open PRs</p>
            <p className="font-mono text-lg font-semibold text-slate-900">
              {project.openPRCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Branches</p>
            <p className="font-mono text-lg font-semibold text-slate-900">
              {project.branchCount}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
          Metadata
        </h2>
        <div className="space-y-4">
          {project.techStack.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-indigo-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.capabilities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {project.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-teal-600"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {project.tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
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
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
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
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-slate-700">{project.notes}</p>
        </div>
      )}

      {/* Local Path */}
      {project.path && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            Local Path
          </h2>
          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono text-slate-700">
            {project.path}
          </code>
        </div>
      )}

      {/* Override Editor */}
      <ProjectEditor
        projectName={project.name}
        initialTags={project.tags}
        initialStatus={project.status}
        initialNotes={project.notes}
      />
    </div>
  );
}
