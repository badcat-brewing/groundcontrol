import { NextRequest, NextResponse } from 'next/server';
import { updateOverride } from '../../../../scanner/overrides';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectName, ...updates } = body;

  if (!projectName) {
    return NextResponse.json({ error: 'projectName required' }, { status: 400 });
  }

  const overrides = updateOverride(projectName, updates);
  return NextResponse.json(overrides[projectName]);
}
