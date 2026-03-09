import { config } from 'dotenv';
config({ path: '.env.local' });

import { runScan } from './index';
import { findOverlaps } from '../src/lib/overlaps';
import { ProjectManifest } from './types';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { homedir } from 'os';
import { validateSyncAction, buildWorkList, cloneRepo, pullRepo, type SyncResult } from './sync';
import { loadOverrides, saveOverrides, updateOverride } from './overrides';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const MANIFEST_PATH = join(DATA_DIR, 'manifest.json');

function showHelp() {
  console.log(`
groundcontrol pm — project manager CLI

Usage: npm run pm <command> [options]

Commands:
  scan            Scan GitHub repos and local projects, generate manifest
  export          Export manifest JSON to stdout or a file path
  overlaps        Show capability overlaps between projects
  sync            Sync repos (clone missing, pull existing)
  overrides       Manage project overrides (list, set)
  help            Show this help text

Scan options:
  --org <name>   Scan a specific GitHub org (can also set GITHUB_ORGS env var)

Export usage:
  npm run pm export                   Print manifest JSON to stdout
  npm run pm export -- <path>         Write manifest to file at <path>

Sync usage:
  npm run pm sync                     Clone missing + pull existing (both)
  npm run pm sync -- clone            Clone missing repos only
  npm run pm sync -- pull             Pull existing repos only
  npm run pm sync -- full             Scan first, then clone + pull (catches new repos)

Overrides usage:
  npm run pm overrides -- list        List all overrides
  npm run pm overrides -- set <project> [--tag <tag>] [--status <status>] [--notes <text>]

Examples:
  npm run pm scan
  npm run pm scan -- --org myorg
  npm run pm export
  npm run pm export -- /tmp/manifest.json
  npm run pm overlaps
  npm run pm sync
  npm run pm sync -- full
  npm run pm sync -- clone
  npm run pm overrides -- list
  npm run pm overrides -- set myproject --tag test --status paused --notes "on hold"
`.trim());
}

function loadManifest(): ProjectManifest | null {
  if (!existsSync(MANIFEST_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

async function handleScan(args: string[]) {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const rawLocalDir = process.env.LOCAL_PROJECTS_DIR;
  const localDir = rawLocalDir?.startsWith('~') ? rawLocalDir.replace('~', homedir()) : rawLocalDir;

  // Parse --org flag from remaining args
  const orgIndex = args.indexOf('--org');
  const org = orgIndex !== -1 ? args[orgIndex + 1] : undefined;

  // Parse GITHUB_ORGS env var (comma-separated)
  const rawOrgs = process.env.GITHUB_ORGS;
  const orgs = rawOrgs
    ? rawOrgs.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : undefined;

  // If --org is provided and orgs array exists, merge it in
  if (org && orgs && !orgs.includes(org)) {
    orgs.push(org);
  }

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN or GITHUB_USERNAME in environment');
    process.exit(1);
  }

  const targets = [username];
  if (orgs?.length) targets.push(...orgs.map(o => `org:${o}`));
  else if (org) targets.push(`org:${org}`);
  console.log(`Scanning repos for: ${targets.join(', ')}...`);

  const manifest = await runScan({
    token,
    username,
    localDir,
    org: orgs ? undefined : org,
    orgs,
    onProgress: (event) => {
      switch (event.phase) {
        case 'fetching':
          if (event.current % 10 === 0 || event.current === 1) {
            console.log(`  Fetching ${event.current}/${event.total}: ${event.repoName}`);
          }
          break;
        case 'enriching':
          if (event.current % 5 === 0 || event.current === 1) {
            console.log(`  Enriching ${event.current}/${event.total}: ${event.repoName}`);
          }
          break;
        case 'writing':
          console.log(event.message);
          break;
        case 'done':
          console.log(`Wrote manifest with ${event.projectCount} projects to ${MANIFEST_PATH}`);
          break;
      }
    },
  });

  // Print summary
  const { projects } = manifest;
  const counts = projects.reduce((acc, p) => {
    acc[p.computedStatus] = (acc[p.computedStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nStatus breakdown:');
  for (const [status, count] of Object.entries(counts)) {
    console.log(`  ${status}: ${count}`);
  }

  // Print source breakdown
  const sourceBreakdown = {
    'local-only': projects.filter(p => p.source === 'local-only').length,
    'remote-only': projects.filter(p => p.source === 'remote-only').length,
    synced: projects.filter(p => p.source === 'synced').length,
  };

  console.log('\nSource breakdown:');
  console.log(`  Local only: ${sourceBreakdown['local-only']}`);
  console.log(`  Remote only: ${sourceBreakdown['remote-only']}`);
  console.log(`  Synced: ${sourceBreakdown.synced}`);

  // Log fork count
  const forkCount = projects.filter(p => p.isFork).length;
  if (forkCount > 0) {
    console.log(`\nFound ${forkCount} forks`);
  }
}

function handleExport(args: string[]) {
  const manifest = loadManifest();
  if (!manifest) {
    console.error('No manifest found. Run `npm run pm scan` first.');
    process.exit(1);
  }

  const outputPath = args[0];
  if (outputPath) {
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest written to ${outputPath}`);
  } else {
    // Print to stdout
    console.log(JSON.stringify(manifest, null, 2));
  }
}

function handleOverlaps() {
  const manifest = loadManifest();
  if (!manifest) {
    console.error('No manifest found. Run `npm run pm scan` first.');
    process.exit(1);
  }

  const overlaps = findOverlaps(manifest.projects);
  const entries = Object.entries(overlaps);

  if (entries.length === 0) {
    console.log('No capability overlaps detected.');
    return;
  }

  // Calculate column widths
  const capHeader = 'Capability';
  const countHeader = 'Count';
  const projectsHeader = 'Projects';

  let maxCapLen = capHeader.length;
  let maxCountLen = countHeader.length;

  for (const [cap, projects] of entries) {
    if (cap.length > maxCapLen) maxCapLen = cap.length;
    const countStr = String(projects.length);
    if (countStr.length > maxCountLen) maxCountLen = countStr.length;
  }

  // Print table
  const capCol = capHeader.padEnd(maxCapLen);
  const countCol = countHeader.padEnd(maxCountLen);
  console.log(`  ${capCol}  ${countCol}  ${projectsHeader}`);
  console.log(`  ${'─'.repeat(maxCapLen)}  ${'─'.repeat(maxCountLen)}  ${'─'.repeat(40)}`);

  for (const [cap, projects] of entries) {
    const names = projects.map(p => p.name).join(', ');
    console.log(`  ${cap.padEnd(maxCapLen)}  ${String(projects.length).padEnd(maxCountLen)}  ${names}`);
  }
}

async function handleSync(args: string[]) {
  const action = args[0] || 'both';

  if (!validateSyncAction(action)) {
    console.error(`Invalid sync action: ${action}. Must be clone, pull, both, or full.`);
    process.exit(1);
  }

  const rawLocalDir = process.env.LOCAL_PROJECTS_DIR;
  const localDir = rawLocalDir?.startsWith('~') ? rawLocalDir.replace('~', homedir()) : rawLocalDir;

  if (!localDir) {
    console.error('LOCAL_PROJECTS_DIR environment variable is not set.');
    process.exit(1);
  }

  // 'full' runs a scan first to ensure the manifest is up-to-date
  if (action === 'full') {
    console.log('Running scan to refresh manifest before sync...');
    console.log('—'.repeat(50));
    await handleScan(args.slice(1));
    console.log('');
  }

  const manifest = loadManifest();
  if (!manifest) {
    console.error('No manifest found. Run `npm run pm scan` first.');
    process.exit(1);
  }

  const work = buildWorkList(manifest.projects, action);
  const total = work.length;

  console.log(`Starting sync: ${total} repos to process`);
  console.log(`Target directory: ${localDir}`);
  console.log('—'.repeat(50));

  const results: SyncResult[] = [];
  const logger = (text: string) => console.log(text);

  for (let i = 0; i < work.length; i++) {
    const item = work[i];
    let result: SyncResult;
    if (item.op === 'clone') {
      result = cloneRepo(logger, item.githubUrl!, localDir, i + 1, total);
    } else {
      result = pullRepo(logger, item.path!, item.name, i + 1, total);
    }
    results.push(result);
  }

  console.log('—'.repeat(50));

  // Print summary table
  if (results.length > 0) {
    const nameHeader = 'Repo';
    const actionHeader = 'Action';
    const resultHeader = 'Result';

    let maxName = nameHeader.length;
    let maxAction = actionHeader.length;
    let maxResult = resultHeader.length;

    for (const r of results) {
      if (r.name.length > maxName) maxName = r.name.length;
      if (r.action.length > maxAction) maxAction = r.action.length;
      if (r.message.length > maxResult) maxResult = r.message.length;
    }

    console.log(`\n  ${nameHeader.padEnd(maxName)}  ${actionHeader.padEnd(maxAction)}  ${resultHeader}`);
    console.log(`  ${'─'.repeat(maxName)}  ${'─'.repeat(maxAction)}  ${'─'.repeat(Math.min(maxResult, 50))}`);

    for (const r of results) {
      const icon = r.success ? '✓' : '✗';
      console.log(`  ${r.name.padEnd(maxName)}  ${r.action.padEnd(maxAction)}  ${icon} ${r.message}`);
    }
  }

  console.log(`\nSync complete. Processed ${total} repos.`);
}

function handleOverrides(args: string[]) {
  const subcommand = args[0];

  if (!subcommand || subcommand === 'list') {
    handleOverridesList();
  } else if (subcommand === 'set') {
    handleOverridesSet(args.slice(1));
  } else {
    console.error(`Unknown overrides subcommand: ${subcommand}. Use list or set.`);
    process.exit(1);
  }
}

function handleOverridesList() {
  const overrides = loadOverrides();
  const entries = Object.entries(overrides);

  if (entries.length === 0) {
    console.log('No overrides set.');
    return;
  }

  const nameHeader = 'Project';
  const statusHeader = 'Status';
  const tagsHeader = 'Tags';
  const notesHeader = 'Notes';

  let maxName = nameHeader.length;
  let maxStatus = statusHeader.length;
  let maxTags = tagsHeader.length;

  for (const [name, override] of entries) {
    if (name.length > maxName) maxName = name.length;
    const status = override.status || '—';
    if (status.length > maxStatus) maxStatus = status.length;
    const tags = override.tags?.join(', ') || '—';
    if (tags.length > maxTags) maxTags = tags.length;
  }

  console.log(`  ${nameHeader.padEnd(maxName)}  ${statusHeader.padEnd(maxStatus)}  ${tagsHeader.padEnd(maxTags)}  ${notesHeader}`);
  console.log(`  ${'─'.repeat(maxName)}  ${'─'.repeat(maxStatus)}  ${'─'.repeat(maxTags)}  ${'─'.repeat(20)}`);

  for (const [name, override] of entries) {
    const status = override.status || '—';
    const tags = override.tags?.join(', ') || '—';
    const notes = override.notes ? (override.notes.length > 40 ? override.notes.substring(0, 37) + '...' : override.notes) : '—';
    console.log(`  ${name.padEnd(maxName)}  ${status.padEnd(maxStatus)}  ${tags.padEnd(maxTags)}  ${notes}`);
  }
}

const VALID_STATUSES = ['active', 'recent', 'stale', 'abandoned', 'paused'];

export function parseOverridesSetArgs(args: string[]): { project: string; tags: string[]; status: string | undefined; notes: string | undefined } | null {
  if (args.length === 0) {
    return null;
  }

  const project = args[0];
  const tags: string[] = [];
  let status: string | undefined;
  let notes: string | undefined;

  let i = 1;
  while (i < args.length) {
    switch (args[i]) {
      case '--tag':
        if (i + 1 < args.length) {
          tags.push(args[i + 1]);
          i += 2;
        } else {
          i++;
        }
        break;
      case '--status':
        if (i + 1 < args.length) {
          status = args[i + 1];
          i += 2;
        } else {
          i++;
        }
        break;
      case '--notes':
        if (i + 1 < args.length) {
          notes = args[i + 1];
          i += 2;
        } else {
          i++;
        }
        break;
      default:
        i++;
        break;
    }
  }

  return { project, tags, status, notes };
}

function handleOverridesSet(args: string[]) {
  const parsed = parseOverridesSetArgs(args);
  if (!parsed) {
    console.error('Usage: npm run pm overrides -- set <project> [--tag <tag>] [--status <status>] [--notes <text>]');
    process.exit(1);
  }

  const { project, tags, status, notes } = parsed;

  if (status && !VALID_STATUSES.includes(status)) {
    console.error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  const updates: Record<string, unknown> = {};
  if (tags.length > 0) updates.tags = tags;
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    console.error('No updates provided. Use --tag, --status, or --notes.');
    process.exit(1);
  }

  updateOverride(project, updates as Parameters<typeof updateOverride>[1]);

  console.log(`Updated overrides for "${project}":`);
  if (tags.length > 0) console.log(`  tags: ${tags.join(', ')}`);
  if (status) console.log(`  status: ${status}`);
  if (notes !== undefined) console.log(`  notes: ${notes}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'scan':
      await handleScan(commandArgs);
      break;
    case 'export':
      handleExport(commandArgs);
      break;
    case 'overlaps':
      handleOverlaps();
      break;
    case 'sync':
      await handleSync(commandArgs);
      break;
    case 'overrides':
      handleOverrides(commandArgs);
      break;
    case 'help':
    case undefined:
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error('CLI failed:', err);
  process.exit(1);
});
