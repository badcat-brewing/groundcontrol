'use client';

import { useState } from 'react';
import type { ProjectStatus } from '../../scanner/types';

interface ProjectEditorProps {
  projectName: string;
  initialTags: string[];
  initialStatus: ProjectStatus | null;
  initialNotes: string | null;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Auto (computed)', value: 'auto' },
  { label: 'Active', value: 'active' },
  { label: 'Recent', value: 'recent' },
  { label: 'Stale', value: 'stale' },
  { label: 'Abandoned', value: 'abandoned' },
  { label: 'Paused', value: 'paused' },
];

async function saveOverrides(
  projectName: string,
  updates: { tags?: string[]; status?: ProjectStatus | null; notes?: string | null }
) {
  const body: Record<string, unknown> = { projectName };
  if (updates.tags !== undefined) body.tags = updates.tags;
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.notes !== undefined) body.notes = updates.notes;

  const res = await fetch('/api/overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Failed to save overrides');
  return res.json();
}

export default function ProjectEditor({
  projectName,
  initialTags,
  initialStatus,
  initialNotes,
}: ProjectEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<string>(initialStatus ?? 'auto');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState<string | null>(null);

  function showSaved(section: string) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  async function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput('');
    await saveOverrides(projectName, { tags: newTags });
    showSaved('tags');
  }

  async function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    await saveOverrides(projectName, { tags: newTags });
    showSaved('tags');
  }

  async function handleStatusChange(value: string) {
    setStatus(value);
    const statusValue = value === 'auto' ? null : (value as ProjectStatus);
    await saveOverrides(projectName, { status: statusValue });
    showSaved('status');
  }

  async function handleNotesSave() {
    const notesValue = notes.trim() || null;
    await saveOverrides(projectName, { notes: notesValue });
    showSaved('notes');
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400">
        Edit Overrides
      </h2>

      <div className="space-y-6">
        {/* Tag Editor */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Tags</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-slate-400 hover:text-slate-700"
                  aria-label={`Remove tag ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-400"
            >
              Add
            </button>
          </div>
          {saved === 'tags' && (
            <p className="mt-1 text-xs text-emerald-600">Saved!</p>
          )}
        </div>

        {/* Status Override */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Status Override
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {saved === 'status' && (
            <p className="mt-1 text-xs text-emerald-600">Saved!</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add notes about this project..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleNotesSave}
              className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-400"
            >
              Save Notes
            </button>
            {saved === 'notes' && (
              <span className="text-xs text-emerald-600">Saved!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
