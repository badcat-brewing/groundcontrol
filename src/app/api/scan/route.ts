import { runScan } from '../../../../scanner/index';
import { homedir } from 'os';
import type { ScanProgressEvent } from '../../../../scanner/progress';

let scanInProgress = false;

export async function GET() {
  if (scanInProgress) {
    return new Response(JSON.stringify({ error: 'Scan already in progress' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const rawLocalDir = process.env.LOCAL_PROJECTS_DIR;
  const localDir = rawLocalDir?.startsWith('~') ? rawLocalDir.replace('~', homedir()) : rawLocalDir;

  // Parse GITHUB_ORGS env var (comma-separated)
  const rawOrgs = process.env.GITHUB_ORGS;
  const orgs = rawOrgs
    ? rawOrgs.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : undefined;

  if (!token || !username) {
    return new Response(JSON.stringify({ error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  scanInProgress = true;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ScanProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Client disconnected, ignore
        }
      };

      runScan({
        token,
        username,
        localDir,
        orgs,
        onProgress: send,
      })
        .then(() => {
          controller.close();
        })
        .catch((err) => {
          send({ phase: 'error', message: err.message || 'Scan failed' });
          controller.close();
        })
        .finally(() => {
          scanInProgress = false;
        });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
