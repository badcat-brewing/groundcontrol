'use client';

import { useEffect, useRef, useState } from 'react';

interface SyncResult {
  name: string;
  action: 'cloned' | 'pulled' | 'skipped';
  success: boolean;
  message: string;
}

interface ProjectInfo {
  name: string;
  path: string | null;
  githubUrl: string | null;
}

export default function SyncPanel({ projects }: { projects: ProjectInfo[] }) {
  const [results, setResults] = useState<SyncResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);

  const localCount = projects.filter(p => p.path).length;
  const remoteOnly = projects.filter(p => !p.path && p.githubUrl).length;

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  async function handleSync(action: 'clone' | 'pull' | 'both') {
    setRunning(true);
    setError(null);
    setResults([]);
    setLogs([]);
    setDone(false);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Sync failed');
        setRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          let event = '';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7);
            if (line.startsWith('data: ')) data = line.slice(6);
          }
          if (!event || !data) continue;

          try {
            const parsed = JSON.parse(data);
            if (event === 'log') {
              setLogs(prev => [...prev, parsed.text]);
            } else if (event === 'result') {
              setResults(prev => [...prev, parsed as SyncResult]);
            } else if (event === 'done') {
              setDone(true);
            } else if (event === 'error') {
              setError(parsed.text);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setRunning(false);
    }
  }

  const cloned = results.filter(r => r.action === 'cloned' && r.success);
  const pulled = results.filter(r => r.action === 'pulled' && r.success);
  const skipped = results.filter(r => r.action === 'skipped');
  const failed = results.filter(r => !r.success);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800">Clone Missing Repos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Download <span className="font-medium text-slate-700">{remoteOnly}</span> repos that aren&apos;t in your local directory yet.
          </p>
          <button
            onClick={() => handleSync('clone')}
            disabled={running || remoteOnly === 0}
            className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {running ? 'Working...' : 'Clone All Missing'}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800">Pull Existing Repos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Fast-forward pull <span className="font-medium text-slate-700">{localCount}</span> local repos. Skips repos with uncommitted changes or merge conflicts.
          </p>
          <button
            onClick={() => handleSync('pull')}
            disabled={running || localCount === 0}
            className="mt-3 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {running ? 'Working...' : 'Pull All Local'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSync('both')}
          disabled={running}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {running ? 'Working...' : 'Clone + Pull All'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {(logs.length > 0 || running) && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">
              sync {running ? '— running' : done ? '— complete' : ''}
            </span>
            {running && (
              <span className="ml-auto text-xs text-slate-500 animate-pulse">
                processing...
              </span>
            )}
          </div>
          <div
            ref={termRef}
            className="p-4 font-mono text-xs leading-5 text-slate-300 max-h-80 overflow-y-auto"
          >
            {logs.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('ERROR') ? 'text-red-400' :
                  line.includes('cloned successfully') ? 'text-emerald-400' :
                  line.includes('pulled successfully') ? 'text-sky-400' :
                  line.includes('skipping') || line.includes('Already up to date') || line.includes('already up to date') ? 'text-slate-500' :
                  line.startsWith('—') || line.startsWith('Starting') || line.startsWith('Sync complete') || line.startsWith('Target') ? 'text-slate-400' :
                  'text-slate-300'
                }
              >
                <span className="text-slate-600 select-none">$ </span>{line}
              </div>
            ))}
            {running && (
              <div className="text-slate-500">
                <span className="text-slate-600 select-none">$ </span>
                <span className="animate-pulse">_</span>
              </div>
            )}
          </div>
        </div>
      )}

      {done && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            {cloned.length > 0 && (
              <span className="text-emerald-600 font-medium">{cloned.length} cloned</span>
            )}
            {pulled.length > 0 && (
              <span className="text-sky-600 font-medium">{pulled.length} pulled</span>
            )}
            {skipped.length > 0 && (
              <span className="text-slate-500 font-medium">{skipped.length} skipped</span>
            )}
            {failed.length > 0 && (
              <span className="text-red-600 font-medium">{failed.length} failed</span>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Repo</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Action</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.name} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-800">{r.name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.action === 'cloned' ? 'bg-emerald-100 text-emerald-700' :
                        r.action === 'pulled' ? 'bg-sky-100 text-sky-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {r.action}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${r.success ? 'text-slate-600' : 'text-red-600'}`}>
                      {r.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
