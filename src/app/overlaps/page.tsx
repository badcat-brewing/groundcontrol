import { readManifest } from '@/lib/manifest';
import { findOverlaps } from '@/lib/overlaps';
import OverlapGrid from '@/components/OverlapGrid';

export default function OverlapsPage() {
  const manifest = readManifest();

  if (!manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            No manifest found
          </h1>
          <p className="text-slate-500">
            Run{' '}
            <code className="rounded bg-slate-100 px-2 py-0.5 text-sm font-mono">
              npm run scan
            </code>{' '}
            to generate project data.
          </p>
        </div>
      </div>
    );
  }

  const overlaps = findOverlaps(manifest.projects);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Capability Overlaps
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Projects that share the same capabilities — potential duplication or
          consolidation opportunities.
        </p>
      </div>

      <OverlapGrid overlaps={overlaps} />
    </div>
  );
}
