import { NextRequest } from 'next/server';
import { readManifest } from '@/lib/manifest';
import { runScan } from '../../../../scanner/index';
import { homedir } from 'os';
import {
  cloneRepo as cloneRepoCore,
  pullRepo as pullRepoCore,
  validateSyncAction,
  buildWorkList,
  type SyncAction,
  type SyncLogger,
} from '../../../../scanner/sync';
import type { ProjectManifest } from '../../../../scanner/types';

type Writer = WritableStreamDefaultWriter<Uint8Array>;
const encoder = new TextEncoder();

async function send(writer: Writer, event: string, data: Record<string, unknown>) {
  await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

async function runSyncWork(writer: Writer, manifest: ProjectManifest, localDir: string, action: SyncAction) {
  const work = buildWorkList(manifest.projects, action);
  const total = work.length;
  await send(writer, 'log', { text: `Starting sync: ${total} repos to process` });
  await send(writer, 'log', { text: `Target directory: ${localDir}` });
  await send(writer, 'log', { text: '—'.repeat(50) });

  for (let i = 0; i < work.length; i++) {
    const item = work[i];
    const logs: string[] = [];
    const logger: SyncLogger = (text) => { logs.push(text); };

    let result;
    if (item.op === 'clone') {
      result = cloneRepoCore(logger, item.githubUrl!, localDir, i + 1, total);
    } else {
      result = pullRepoCore(logger, item.path!, item.name, i + 1, total);
    }

    for (const log of logs) {
      await send(writer, 'log', { text: log });
    }
    await send(writer, 'result', { name: result.name, action: result.action, success: result.success, message: result.message });
  }

  await send(writer, 'log', { text: '—'.repeat(50) });
  await send(writer, 'log', { text: `Sync complete. Processed ${total} repos.` });
  await send(writer, 'done', {});
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body as { action: string };

  if (!validateSyncAction(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action. Must be clone, pull, both, or full.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawLocalDir = process.env.LOCAL_PROJECTS_DIR;
  const localDir = rawLocalDir?.startsWith('~') ? rawLocalDir.replace('~', homedir()) : rawLocalDir;
  if (!localDir) {
    return new Response(JSON.stringify({ error: 'LOCAL_PROJECTS_DIR environment variable is not set' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  if (action === 'full') {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;
    if (!token || !username) {
      return new Response(JSON.stringify({ error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME for scan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawOrgs = process.env.GITHUB_ORGS;
    const orgs = rawOrgs ? rawOrgs.split(',').map(o => o.trim()).filter(o => o.length > 0) : undefined;

    (async () => {
      try {
        await send(writer, 'log', { text: 'Running scan to refresh manifest...' });
        await runScan({
          token, username, localDir, orgs,
          onProgress: (event) => {
            if (event.phase === 'done') {
              send(writer, 'log', { text: `Scan complete: ${event.projectCount} projects found` });
            }
          },
        });
        await send(writer, 'log', { text: '—'.repeat(50) });

        const manifest = readManifest();
        if (!manifest) {
          await send(writer, 'error', { text: 'Scan completed but manifest not found' });
          return;
        }
        await runSyncWork(writer, manifest, localDir, 'full');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await send(writer, 'error', { text: msg });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, { headers: sseHeaders });
  }

  const manifest = readManifest();
  if (!manifest) {
    return new Response(JSON.stringify({ error: 'No manifest found. Run a scan first.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  (async () => {
    try {
      await runSyncWork(writer, manifest, localDir, action);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await send(writer, 'error', { text: msg });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, { headers: sseHeaders });
}
