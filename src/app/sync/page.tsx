import { readManifest } from '@/lib/manifest';
import SyncPanel from '@/components/SyncPanel';

export default function SyncPage() {
  const manifest = readManifest();

  if (!manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">No manifest found</h1>
          <p className="text-slate-500">
            Run a scan first to generate project data.
          </p>
        </div>
      </div>
    );
  }

  const projects = manifest.projects.map(p => ({
    name: p.name,
    path: p.path,
    githubUrl: p.githubUrl,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Sync Repos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Clone missing repos to your local directory or pull the latest changes for existing ones.
        </p>
      </div>
      <SyncPanel projects={projects} />
    </div>
  );
}
