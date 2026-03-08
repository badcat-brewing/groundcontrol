'use client';

import { useState, useEffect } from 'react';

interface CreateRemoteModalProps {
  projectName: string;
  onClose: () => void;
  onCreated: (githubUrl: string) => void;
}

export default function CreateRemoteModal({ projectName, onClose, onCreated }: CreateRemoteModalProps) {
  const [repoName, setRepoName] = useState(projectName);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [gitignore, setGitignore] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGitignore, setLoadingGitignore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(projectName)}/gitignore`)
      .then((r) => r.json())
      .then((data) => setGitignore(data.content || ''))
      .catch(() => {})
      .finally(() => setLoadingGitignore(false));
  }, [projectName]);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/create-remote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, visibility, gitignore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create remote');
      onCreated(data.githubUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Create Remote Repository</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Repository Name</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Visibility</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  visibility === 'private'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  visibility === 'public'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Public
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">.gitignore</label>
            {loadingGitignore ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <textarea
                value={gitignore}
                onChange={(e) => setGitignore(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                placeholder="# Add .gitignore rules..."
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !repoName.trim()}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create & Push'}
          </button>
        </div>
      </div>
    </div>
  );
}
