import { NextRequest } from 'next/server';
import { readManifest } from '@/lib/manifest';
import {
  cloneRepo as cloneRepoCore,
  pullRepo as pullRepoCore,
  validateSyncAction,
  buildWorkList,
  type SyncLogger,
} from '../../../../scanner/sync';

type Writer = WritableStreamDefaultWriter<Uint8Array>;
const encoder = new TextEncoder();

async function send(writer: Writer, event: string, data: Record<string, unknown>) {
  await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

function writerLogger(writer: Writer): SyncLogger {
  // Buffer log calls and send them — since cloneRepo/pullRepo are sync,
  // we collect logs and replay them as SSE events after each operation
  return (text: string) => {
    // For sync functions we can't await, so we use a fire-and-forget pattern
    // This is fine because the writer is sequential within the async IIFE
    send(writer, 'log', { text });
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body as { action: string };

  if (!validateSyncAction(action)) {
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

  const work = buildWorkList(manifest.projects, action);

  // Process in background
  (async () => {
    try {
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

        // Send collected logs as SSE events
        for (const log of logs) {
          await send(writer, 'log', { text: log });
        }
        await send(writer, 'result', { name: result.name, action: result.action, success: result.success, message: result.message });
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
