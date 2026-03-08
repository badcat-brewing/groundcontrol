import { NextRequest, NextResponse } from 'next/server';
import { readManifest } from '@/lib/manifest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const manifest = readManifest();
  const project = manifest?.projects.find((p) => p.name === decodedName);
  if (!project?.path) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const gitignorePath = join(project.path, '.gitignore');
  let content = '';
  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, 'utf-8');
  }

  return NextResponse.json({ content });
}
