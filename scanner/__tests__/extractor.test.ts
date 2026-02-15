import { describe, it, expect } from 'vitest';
import { extractDescription, extractCapabilities, detectTechStack } from '../extractor';

describe('extractDescription', () => {
  it('extracts first non-heading paragraph from markdown', () => {
    const md = '# My Project\n\nThis is a cool project that does things.\n\n## Features\n\n- stuff';
    expect(extractDescription(md)).toBe('This is a cool project that does things.');
  });

  it('returns null for empty content', () => {
    expect(extractDescription('')).toBeNull();
  });

  it('skips badge lines and blank lines', () => {
    const md = '# Title\n\n![badge](url)\n\nActual description here.';
    expect(extractDescription(md)).toBe('Actual description here.');
  });
});

describe('extractCapabilities', () => {
  it('maps known keywords to canonical capabilities', () => {
    const md = '## Features\n\n- Email sending via SES\n- JWT authentication\n- S3 file uploads';
    const caps = extractCapabilities(md);
    expect(caps).toContain('email-sending');
    expect(caps).toContain('authentication');
    expect(caps).toContain('file-storage');
  });

  it('deduplicates capabilities', () => {
    const md = '- Email via SMTP\n- SES integration\n- Sendgrid backup';
    const caps = extractCapabilities(md);
    const emailCount = caps.filter(c => c === 'email-sending').length;
    expect(emailCount).toBe(1);
  });

  it('returns empty array when no capabilities match', () => {
    expect(extractCapabilities('# Just a title')).toEqual([]);
  });
});

describe('detectTechStack', () => {
  it('detects from package.json dependencies', () => {
    const deps = { 'next': '15.0.0', 'express': '4.0.0', '@aws-sdk/client-s3': '3.0.0' };
    const stack = detectTechStack(deps, []);
    expect(stack).toContain('next.js');
    expect(stack).toContain('express');
    expect(stack).toContain('aws-s3');
  });

  it('detects from file extensions', () => {
    const stack = detectTechStack({}, ['.py', '.go', '.ts']);
    expect(stack).toContain('python');
    expect(stack).toContain('go');
    expect(stack).toContain('typescript');
  });
});
