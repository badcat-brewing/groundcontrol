import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ProjectManifest } from '../../scanner/types';

const MANIFEST_PATH = join(process.cwd(), 'data', 'manifest.json');

export function readManifest(): ProjectManifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return null;
  }
}
