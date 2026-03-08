import { NextRequest, NextResponse } from 'next/server';
import { readManifest } from '@/lib/manifest';
import { execFileSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const body = await request.json();

  const { repoName, visibility, gitignore } = body as {
    repoName: string;
    visibility: 'public' | 'private';
    gitignore?: string;
  };

  // Validate repo name
  if (!repoName || !/^[a-zA-Z0-9._-]+$/.test(repoName)) {
    return NextResponse.json({ error: 'Invalid repo name' }, { status: 400 });
  }

  // Find project in manifest
  const manifest = readManifest();
  const project = manifest?.projects.find((p) => p.name === decodedName);
  if (!project?.path) {
    return NextResponse.json({ error: 'Project not found or has no local path' }, { status: 404 });
  }

  // Verify it's a git repo
  if (!existsSync(join(project.path, '.git'))) {
    return NextResponse.json({ error: 'Not a git repo' }, { status: 400 });
  }

  // Check for commits
  try {
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: project.path, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return NextResponse.json({ error: 'No commits found. Make an initial commit first.' }, { status: 400 });
  }

  // Write .gitignore if provided
  if (gitignore !== undefined) {
    writeFileSync(join(project.path, '.gitignore'), gitignore);
  }

  // Create remote repo
  try {
    const visFlag = visibility === 'public' ? '--public' : '--private';
    const result = execFileSync('gh', [
      'repo', 'create', repoName,
      visFlag,
      '--source', project.path,
      '--push',
    ], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Extract URL from gh output
    const urlMatch = result.match(/https:\/\/github\.com\/[^\s]+/);
    const githubUrl = urlMatch ? urlMatch[0] : null;

    return NextResponse.json({ success: true, githubUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create remote';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
