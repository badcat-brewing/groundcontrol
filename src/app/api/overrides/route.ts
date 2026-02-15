import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { Overrides } from '../../../../scanner/types';

const OVERRIDES_PATH = join(process.cwd(), 'data', 'overrides.json');

function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectName, ...updates } = body;

  if (!projectName) {
    return NextResponse.json({ error: 'projectName required' }, { status: 400 });
  }

  const overrides = loadOverrides();
  overrides[projectName] = { ...overrides[projectName], ...updates };
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));

  return NextResponse.json(overrides[projectName]);
}
