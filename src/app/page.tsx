import { readManifest } from '@/lib/manifest';
import SummaryCards from '@/components/SummaryCards';
import ProjectTable from '@/components/ProjectTable';

export default function Home() {
  const manifest = readManifest();

  if (!manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            No manifest found
          </h1>
          <p className="text-gray-500">
            Run <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono">npm run scan</code> to generate project data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Project PM</h1>
          <p className="text-sm text-gray-500">
            Last scanned:{' '}
            {new Date(manifest.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="mb-8">
          <SummaryCards projects={manifest.projects} />
        </div>

        <ProjectTable projects={manifest.projects} />
      </div>
    </div>
  );
}
