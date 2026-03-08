import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Overrides, ProjectStatus } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OVERRIDES_PATH = join(__dirname, '..', 'data', 'overrides.json');

export function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: Overrides): void {
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2));
}

export function updateOverride(
  projectName: string,
  updates: { tags?: string[]; status?: ProjectStatus; notes?: string },
): Overrides {
  const overrides = loadOverrides();
  overrides[projectName] = { ...overrides[projectName], ...updates };
  saveOverrides(overrides);
  return overrides;
}
