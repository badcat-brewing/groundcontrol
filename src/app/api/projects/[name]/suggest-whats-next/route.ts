import { NextRequest, NextResponse } from 'next/server';
import { readManifest } from '@/lib/manifest';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const manifest = readManifest();
  const project = manifest?.projects.find((p) => p.name === decodedName);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Build context from project data
  const context = [
    `Project: ${project.name}`,
    project.description ? `Description: ${project.description}` : null,
    project.techStack.length > 0 ? `Tech Stack: ${project.techStack.join(', ')}` : null,
    project.capabilities.length > 0 ? `Capabilities: ${project.capabilities.join(', ')}` : null,
    `Status: ${project.computedStatus}`,
    `Last commit: ${project.lastCommitDate || 'never'}`,
    `Commits in last 30 days: ${project.commitCountLast30Days}`,
    project.source ? `Source: ${project.source}` : null,
    project.hasClaude ? 'Has CLAUDE.md' : null,
    project.hasReadme ? 'Has README' : null,
    project.hasTodos ? 'Has TODO file' : null,
    project.hasPlanDocs ? 'Has plan docs' : null,
    project.tags.length > 0 ? `Tags: ${project.tags.join(', ')}` : null,
    project.notes ? `Notes: ${project.notes}` : null,
  ].filter(Boolean).join('\n');

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Based on this project context, suggest 2-3 concrete, creative, and practical next steps for this project. Format as markdown with a brief heading for each step and a sentence or two of explanation. Be specific to the project, not generic advice.\n\n${context}`,
      },
    ],
  });

  const suggestion = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return NextResponse.json({ suggestion });
}
