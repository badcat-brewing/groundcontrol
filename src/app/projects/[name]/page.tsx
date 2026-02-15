import Link from 'next/link';
import { readManifest } from '@/lib/manifest';
import ProjectDetail from '@/components/ProjectDetail';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

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

  const project = manifest.projects.find((p) => p.name === decodedName);

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">
            Project not found
          </h1>
          <p className="mb-4 text-slate-500">
            No project named &ldquo;{decodedName}&rdquo; exists in the manifest.
          </p>
          <Link
            href="/"
            className="text-sky-600 hover:text-sky-700"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to dashboard
      </Link>
      <ProjectDetail project={project} />
    </div>
  );
}
