import { readManifest } from '@/lib/manifest';
import SummaryCards from '@/components/SummaryCards';
import ProjectTable from '@/components/ProjectTable';

export default function Home() {
  const manifest = readManifest();

  if (!manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            No manifest found
          </h1>
          <p className="text-slate-500">
            Run <code className="rounded bg-slate-100 px-2 py-0.5 text-sm font-mono">npm run scan</code> to generate project data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-xs text-slate-400">
          Last scanned:{' '}
          {new Date(manifest.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="mb-6">
        <SummaryCards projects={manifest.projects} />
      </div>

      <ProjectTable projects={manifest.projects} />
    </div>
  );
}
