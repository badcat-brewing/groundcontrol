import { NextRequest, NextResponse } from 'next/server';
import { readManifest } from '@/lib/manifest';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const body = await request.json();

  const { content, push } = body as { content: string; push?: boolean };

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const manifest = readManifest();
  const project = manifest?.projects.find((p) => p.name === decodedName);
  if (!project?.path) {
    return NextResponse.json({ error: 'Project not found or has no local path' }, { status: 404 });
  }

  // Create .groundcontrol dir if needed
  const gcDir = join(project.path, '.groundcontrol');
  if (!existsSync(gcDir)) {
    mkdirSync(gcDir, { recursive: true });
  }

  // Write the file
  const filePath = join(gcDir, 'WHATS-NEXT.md');
  writeFileSync(filePath, content);

  // Optionally commit and push
  if (push) {
    try {
      execFileSync('git', ['add', filePath], { cwd: project.path, stdio: ['pipe', 'pipe', 'pipe'] });
      execFileSync('git', ['commit', '-m', "Update what's next"], { cwd: project.path, stdio: ['pipe', 'pipe', 'pipe'] });
      execFileSync('git', ['push'], { cwd: project.path, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Git push failed';
      return NextResponse.json({ error: message, saved: true }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
