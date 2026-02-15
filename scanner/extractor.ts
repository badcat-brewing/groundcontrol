const CAPABILITY_MAP: Record<string, string> = {
  'email': 'email-sending',
  'smtp': 'email-sending',
  'ses': 'email-sending',
  'sendgrid': 'email-sending',
  'auth': 'authentication',
  'login': 'authentication',
  'oauth': 'authentication',
  'jwt': 'authentication',
  's3': 'file-storage',
  'upload': 'file-storage',
  'api': 'api-server',
  'express': 'api-server',
  'fastify': 'api-server',
  'websocket': 'realtime',
  'socket': 'realtime',
  'database': 'database',
  'postgres': 'database',
  'mysql': 'database',
  'mongo': 'database',
  'dynamodb': 'database',
  'redis': 'caching',
  'cache': 'caching',
  'queue': 'message-queue',
  'sqs': 'message-queue',
  'cron': 'scheduling',
  'schedule': 'scheduling',
};

const DEP_STACK_MAP: Record<string, string> = {
  'next': 'next.js',
  'react': 'react',
  'express': 'express',
  'fastify': 'fastify',
  '@aws-sdk/client-s3': 'aws-s3',
  '@aws-sdk/client-ses': 'aws-ses',
  '@aws-sdk/client-dynamodb': 'aws-dynamodb',
  'tailwindcss': 'tailwind',
};

const EXT_STACK_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.rb': 'ruby',
};

export function extractDescription(markdown: string): string | null {
  if (!markdown.trim()) return null;

  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('![')) continue;
    if (trimmed.startsWith('[![')) continue;
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) continue;
    if (trimmed.startsWith('```')) continue;
    return trimmed;
  }
  return null;
}

export function extractCapabilities(markdown: string): string[] {
  const lower = markdown.toLowerCase();
  const found = new Set<string>();

  for (const [keyword, capability] of Object.entries(CAPABILITY_MAP)) {
    if (lower.includes(keyword)) {
      found.add(capability);
    }
  }

  return Array.from(found).sort();
}

export function detectTechStack(
  dependencies: Record<string, string>,
  fileExtensions: string[]
): string[] {
  const stack = new Set<string>();

  for (const dep of Object.keys(dependencies)) {
    const mapped = DEP_STACK_MAP[dep];
    if (mapped) stack.add(mapped);
  }

  for (const ext of fileExtensions) {
    const mapped = EXT_STACK_MAP[ext];
    if (mapped) stack.add(mapped);
  }

  return Array.from(stack).sort();
}
