import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

const MANIFEST_PATH = join(process.cwd(), 'data', 'manifest.json');

export async function GET() {
  if (!existsSync(MANIFEST_PATH)) {
    return NextResponse.json({ error: 'No manifest found' }, { status: 404 });
  }
  const content = readFileSync(MANIFEST_PATH, 'utf-8');
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="project-pm-manifest.json"',
    },
  });
}
