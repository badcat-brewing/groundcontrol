import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

export interface LocalProjectData {
  hasClaude: boolean;
  hasReadme: boolean;
  hasPlanDocs: boolean;
  hasTodos: boolean;
  claudeContent: string | null;
  readmeContent: string | null;
  fileExtensions: string[];
  dependencies: Record<string, string>;
}

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function collectExtensions(dir: string, maxDepth: number = 2): string[] {
  const extensions = new Set<string>();
  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else {
          const ext = extname(entry.name);
          if (ext) extensions.add(ext);
        }
      }
    } catch {
      // permission errors, etc.
    }
  }
  walk(dir, 0);
  return Array.from(extensions);
}

export function readLocalProject(projectDir: string): LocalProjectData {
  const claudeContent = readFileOrNull(join(projectDir, 'CLAUDE.md'));
  const readmeContent = readFileOrNull(join(projectDir, 'README.md'));

  const planDocsDir = join(projectDir, 'docs', 'plans');
  let hasPlanDocs = false;
  try {
    const planFiles = readdirSync(planDocsDir);
    hasPlanDocs = planFiles.some(f => f.endsWith('.md'));
  } catch {
    hasPlanDocs = false;
  }

  const todoNames = ['TODO.md', 'TODO', 'TODOS.md', 'TO-DOS.md'];
  const hasTodos = todoNames.some(name => existsSync(join(projectDir, name)));

  let dependencies: Record<string, string> = {};
  const pkgContent = readFileOrNull(join(projectDir, 'package.json'));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      // malformed package.json
    }
  }

  return {
    hasClaude: claudeContent !== null,
    hasReadme: readmeContent !== null,
    hasPlanDocs,
    hasTodos,
    claudeContent,
    readmeContent,
    fileExtensions: collectExtensions(projectDir),
    dependencies,
  };
}
