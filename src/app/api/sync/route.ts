import { execFileSync, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { NextRequest } from 'next/server';
import { readManifest } from '@/lib/manifest';

function isCleanWorkingTree(repoPath: string): boolean {
  try {
    const status = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf-8' });
    return status.trim() === '';
  } catch {
    return false;
  }
}

type Writer = WritableStreamDefaultWriter<Uint8Array>;
const encoder = new TextEncoder();

async function send(writer: Writer, event: string, data: Record<string, unknown>) {
  await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

async function cloneRepo(writer: Writer, githubUrl: string, targetDir: string, index: number, total: number) {
  const name = githubUrl.split('/').pop() || '';
  const dest = join(targetDir, name);

  if (existsSync(dest)) {
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — already exists locally, skipping` });
    await send(writer, 'result', { name, action: 'skipped', success: true, message: 'Already exists locally' });
    return;
  }

  const cloneUrl = githubUrl.endsWith('.git') ? githubUrl : `${githubUrl}.git`;
  await send(writer, 'log', { text: `[${index}/${total}] ${name} — cloning from ${githubUrl}...` });
  try {
    execFileSync('git', ['clone', cloneUrl, dest], { encoding: 'utf-8', timeout: 120000 });
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — cloned successfully` });
    await send(writer, 'result', { name, action: 'cloned', success: true, message: 'Cloned successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const short = msg.split('\n')[0];
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — ERROR: ${short}` });
    await send(writer, 'result', { name, action: 'cloned', success: false, message: short });
  }
}

async function pullRepo(writer: Writer, repoPath: string, name: string, index: number, total: number) {
  if (!existsSync(repoPath)) {
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — not found locally, skipping` });
    await send(writer, 'result', { name, action: 'skipped', success: true, message: 'Not found locally' });
    return;
  }

  await send(writer, 'log', { text: `[${index}/${total}] ${name} — checking working tree...` });

  if (!isCleanWorkingTree(repoPath)) {
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — uncommitted changes, skipping` });
    await send(writer, 'result', { name, action: 'skipped', success: true, message: 'Working tree has uncommitted changes' });
    return;
  }

  await send(writer, 'log', { text: `[${index}/${total}] ${name} — pulling (ff-only)...` });
  try {
    const output = execSync('git pull --ff-only', { cwd: repoPath, encoding: 'utf-8', timeout: 60000 });
    const trimmed = output.trim();
    const message = trimmed.includes('Already up to date') ? 'Already up to date' : 'Pulled successfully';
    await send(writer, 'log', { text: `[${index}/${total}] ${name} — ${message.toLowerCase()}` });
    await send(writer, 'result', { name, action: 'pulled', success: true, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Not possible to fast-forward')) {
      await send(writer, 'log', { text: `[${index}/${total}] ${name} — cannot fast-forward, skipping` });
      await send(writer, 'result', { name, action: 'skipped', success: true, message: 'Cannot fast-forward, manual merge needed' });
    } else {
      const short = msg.split('\n')[0];
      await send(writer, 'log', { text: `[${index}/${total}] ${name} — ERROR: ${short}` });
      await send(writer, 'result', { name, action: 'pulled', success: false, message: short });
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body as { action: string };

  if (!['clone', 'pull', 'both'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action. Must be clone, pull, or both.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const localDir = process.env.LOCAL_PROJECTS_DIR;
  if (!localDir) {
    return new Response(JSON.stringify({ error: 'LOCAL_PROJECTS_DIR environment variable is not set' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const manifest = readManifest();
  if (!manifest) {
    return new Response(JSON.stringify({ error: 'No manifest found. Run a scan first.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  // Build work list
  const work: Array<{ project: (typeof manifest.projects)[0]; op: 'clone' | 'pull' }> = [];
  for (const project of manifest.projects) {
    if ((action === 'clone' || action === 'both') && !project.path && project.githubUrl) {
      work.push({ project, op: 'clone' });
    } else if ((action === 'pull' || action === 'both') && project.path) {
      work.push({ project, op: 'pull' });
    }
  }

  // Process in background
  (async () => {
    try {
      const total = work.length;
      await send(writer, 'log', { text: `Starting sync: ${total} repos to process` });
      await send(writer, 'log', { text: `Target directory: ${localDir}` });
      await send(writer, 'log', { text: '—'.repeat(50) });

      for (let i = 0; i < work.length; i++) {
        const { project, op } = work[i];
        if (op === 'clone') {
          await cloneRepo(writer, project.githubUrl!, localDir, i + 1, total);
        } else {
          await pullRepo(writer, project.path!, project.name, i + 1, total);
        }
      }

      await send(writer, 'log', { text: '—'.repeat(50) });
      await send(writer, 'log', { text: `Sync complete. Processed ${total} repos.` });
      await send(writer, 'done', {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await send(writer, 'error', { text: msg });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
