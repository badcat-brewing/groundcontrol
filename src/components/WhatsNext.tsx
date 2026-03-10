'use client';

import { useState } from 'react';

interface WhatsNextProps {
  projectName: string;
  initialContent: string | null;
  hasLocalPath: boolean;
}

export default function WhatsNext({ projectName, initialContent, hasLocalPath }: WhatsNextProps) {
  const [content, setContent] = useState(initialContent || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/suggest-whats-next`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get suggestion');
      setContent(data.suggestion);
      setEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSave(push: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/whats-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, push }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSaved(push ? 'Saved & pushed!' : 'Saved locally!');
      setEditing(false);
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/whats-next`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear');
      setContent('');
      setEditing(false);
      setSaved('Cleared!');
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
          What&apos;s Next
        </h2>
        <div className="flex gap-2">
          {!editing && content && hasLocalPath && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="rounded-md px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? 'Clearing...' : 'Clear'}
              </button>
            </>
          )}
          {!editing && (
            <button
              type="button"
              onClick={handleSuggest}
              disabled={suggesting}
              className="rounded-md bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-50"
            >
              {suggesting ? 'Thinking...' : content ? 'Re-generate' : 'Suggest What\'s Next'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
          <div className="mt-2 flex gap-2">
            {hasLocalPath && (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="rounded-md bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Locally'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={loading}
                  className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Push'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : content ? (
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          No &quot;what&apos;s next&quot; defined for this project.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-sm text-emerald-600">{saved}</p>}
    </div>
  );
}
