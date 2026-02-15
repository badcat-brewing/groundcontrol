import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchAllRepos } from './github';
import { readLocalProject } from './local';
import { extractDescription, extractCapabilities, detectTechStack } from './extractor';
import { computeStatus } from './status';
import { Project, ProjectManifest, Overrides } from './types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');
const OVERRIDES_PATH = join(DATA_DIR, 'overrides.json');

function loadOverrides(): Overrides {
  try {
    return JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function findLocalPath(name: string, localDir: string): string | null {
  const candidate = join(localDir, name);
  try {
    return existsSync(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const localDir = process.env.LOCAL_PROJECTS_DIR;

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN or GITHUB_USERNAME in environment');
    process.exit(1);
  }

  console.log(`Fetching repos for ${username}...`);
  const repos = await fetchAllRepos(token, username);
  console.log(`Found ${repos.length} repos on GitHub`);

  const overrides = loadOverrides();
  const projects: Project[] = [];

  for (const repo of repos) {
    const localPath = localDir ? findLocalPath(repo.name, localDir) : null;
    let local = {
      hasClaude: false,
      hasReadme: false,
      hasPlanDocs: false,
      hasTodos: false,
      claudeContent: null as string | null,
      readmeContent: null as string | null,
      fileExtensions: [] as string[],
      dependencies: {} as Record<string, string>,
    };

    if (localPath) {
      local = readLocalProject(localPath);
    }

    const docContent = local.claudeContent || local.readmeContent || '';
    const description = extractDescription(docContent);
    const capabilities = extractCapabilities(docContent);
    const techStack = detectTechStack(local.dependencies, local.fileExtensions);

    const override = overrides[repo.name] || {};
    const computed = computeStatus(repo.lastCommitDate);

    projects.push({
      name: repo.name,
      path: localPath,
      githubUrl: repo.githubUrl,
      lastCommitDate: repo.lastCommitDate,
      commitCountLast30Days: repo.commitCountLast30Days,
      openPRCount: repo.openPRCount,
      defaultBranch: repo.defaultBranch,
      branchCount: repo.branchCount,
      hasClaude: local.hasClaude,
      hasReadme: local.hasReadme,
      hasPlanDocs: local.hasPlanDocs,
      hasTodos: local.hasTodos,
      description,
      techStack,
      capabilities,
      tags: override.tags || [],
      status: override.status || null,
      notes: override.notes || null,
      computedStatus: override.status || computed,
    });
  }

  // Sort: active first, then recent, stale, abandoned
  const statusOrder: Record<string, number> = { active: 0, recent: 1, stale: 2, paused: 3, abandoned: 4 };
  projects.sort((a, b) => statusOrder[a.computedStatus] - statusOrder[b.computedStatus]);

  const manifest: ProjectManifest = {
    generatedAt: new Date().toISOString(),
    projects,
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${projects.length} projects to ${MANIFEST_PATH}`);

  // Print summary
  const counts = projects.reduce((acc, p) => {
    acc[p.computedStatus] = (acc[p.computedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nSummary:');
  for (const [status, count] of Object.entries(counts)) {
    console.log(`  ${status}: ${count}`);
  }
}

main().catch(err => {
  console.error('Scanner failed:', err);
  process.exit(1);
});
