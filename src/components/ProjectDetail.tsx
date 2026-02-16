import StatusBadge from './StatusBadge';
import SourceBadge from './SourceBadge';
import ProjectEditor from './ProjectEditor';
import { Project, ProjectSource, LocalRemoteDiff } from '../../scanner/types';
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

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-400',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  Java: 'bg-red-500',
  C: 'bg-gray-600',
  'C++': 'bg-blue-600',
  PHP: 'bg-purple-500',
  Ruby: 'bg-red-600',
};

function getLanguageColor(lang: string): string {
  return languageColors[lang] || 'bg-slate-400';
}

function formatSize(sizeKB: number): string {
  if (sizeKB > 1024) {
    return `${(sizeKB / 1024).toFixed(1)} MB`;
  }
  return `${sizeKB} KB`;
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

      {/* Source & Remote Metadata (only if source or other new fields exist) */}
      {(project.source || project.visibility || project.isArchived || project.isFork || project.license || (project.languages && Object.keys(project.languages).length > 0) || (project.topics && project.topics.length > 0)) && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            Source & Remote Metadata
          </h2>
          <div className="space-y-3">
            {/* Source badge and metadata row 1 */}
            <div className="flex flex-wrap items-center gap-3">
              {project.source && <SourceBadge source={project.source} />}
              {project.visibility && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${project.visibility === 'public' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {project.visibility === 'public' ? 'Public' : 'Private'}
                </span>
              )}
              {project.isArchived && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                  Archived
                </span>
              )}
              {project.isFork && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Fork
                </span>
              )}
            </div>

            {/* Size and License */}
            <div className="flex flex-wrap gap-4">
              {project.sizeKB !== undefined && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Size</p>
                  <p className="text-sm text-slate-900">{formatSize(project.sizeKB)}</p>
                </div>
              )}
              {project.license && (
                <div>
                  <p className="text-xs font-medium text-slate-500">License</p>
                  <p className="text-sm text-slate-900">{project.license}</p>
                </div>
              )}
            </div>

            {/* Languages bar */}
            {project.languages && Object.keys(project.languages).length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Languages</p>
                <div className="flex h-6 overflow-hidden rounded bg-slate-100">
                  {Object.entries(project.languages)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([lang, bytes]) => {
                      const total = Object.values(project.languages).reduce((a, b) => a + b, 0);
                      const pct = ((bytes / total) * 100).toFixed(0);
                      return (
                        <div
                          key={lang}
                          className={`${getLanguageColor(lang)}`}
                          style={{ width: `${pct}%` }}
                          title={`${lang} ${pct}%`}
                        />
                      );
                    })}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {Object.keys(project.languages).slice(0, 5).join(', ')}
                  {Object.keys(project.languages).length > 5 && ' +more'}
                </p>
              </div>
            ) : (
              project.languages && <p className="text-xs text-slate-500">No language data</p>
            )}

            {/* Topics */}
            {project.topics && project.topics.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs text-purple-600"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Local vs Remote Diff */}
      {project.diff && project.diff !== undefined && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            Local vs Remote
          </h2>
          <div className="space-y-3">
            {/* Branch info */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Local Branch</p>
                <p className="font-mono text-sm text-slate-900">{project.diff.localBranch}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Remote Branch</p>
                <p className="font-mono text-sm text-slate-900">origin/{project.diff.remoteBranch}</p>
              </div>
            </div>

            {/* Ahead/Behind */}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Commits Status</p>
              {project.diff.aheadCount === 0 && project.diff.behindCount === 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">Up to date</span>
                </div>
              ) : (
                <div className="text-sm text-slate-700">
                  {project.diff.aheadCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 mr-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {project.diff.aheadCount} ahead
                    </div>
                  )}
                  {project.diff.behindCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {project.diff.behindCount} behind
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Uncommitted changes */}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Working Tree</p>
              {project.diff.hasUncommittedChanges ? (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-amber-700">Uncommitted changes</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">Clean</span>
                </div>
              )}
            </div>

            {/* Local-only branches */}
            {project.diff.localOnlyBranches.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Local-only branches</p>
                <p className="text-sm text-slate-700">{project.diff.localOnlyBranches.join(', ')}</p>
              </div>
            )}

            {/* Remote-only branches */}
            {project.diff.remoteOnlyBranches.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Remote-only branches</p>
                <p className="text-sm text-slate-700">{project.diff.remoteOnlyBranches.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
