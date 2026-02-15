import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readLocalProject } from '../local';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(__dirname, '__fixtures__', 'test-project');

describe('readLocalProject', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(join(__dirname, '__fixtures__'), { recursive: true, force: true });
  });

  it('detects CLAUDE.md and README.md', () => {
    writeFileSync(join(TEST_DIR, 'CLAUDE.md'), '# My Project\n\nA cool project.');
    writeFileSync(join(TEST_DIR, 'README.md'), '# Readme');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasClaude).toBe(true);
    expect(result.hasReadme).toBe(true);
    expect(result.claudeContent).toContain('A cool project');
  });

  it('detects plan docs', () => {
    mkdirSync(join(TEST_DIR, 'docs', 'plans'), { recursive: true });
    writeFileSync(join(TEST_DIR, 'docs', 'plans', 'plan.md'), '# Plan');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasPlanDocs).toBe(true);
  });

  it('detects TODO files', () => {
    writeFileSync(join(TEST_DIR, 'TODO.md'), '- [ ] Do thing');
    const result = readLocalProject(TEST_DIR);
    expect(result.hasTodos).toBe(true);
  });

  it('collects file extensions', () => {
    writeFileSync(join(TEST_DIR, 'index.ts'), '');
    writeFileSync(join(TEST_DIR, 'app.py'), '');
    const result = readLocalProject(TEST_DIR);
    expect(result.fileExtensions).toContain('.ts');
    expect(result.fileExtensions).toContain('.py');
  });

  it('reads package.json dependencies', () => {
    writeFileSync(join(TEST_DIR, 'package.json'), JSON.stringify({
      dependencies: { 'next': '15.0.0' },
      devDependencies: { 'vitest': '1.0.0' },
    }));
    const result = readLocalProject(TEST_DIR);
    expect(result.dependencies).toHaveProperty('next');
    expect(result.dependencies).toHaveProperty('vitest');
  });

  it('returns sensible defaults for empty directory', () => {
    const result = readLocalProject(TEST_DIR);
    expect(result.hasClaude).toBe(false);
    expect(result.hasReadme).toBe(false);
    expect(result.hasPlanDocs).toBe(false);
    expect(result.hasTodos).toBe(false);
    expect(result.claudeContent).toBeNull();
    expect(result.readmeContent).toBeNull();
  });
});
