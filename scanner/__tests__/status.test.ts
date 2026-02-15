import { describe, it, expect } from 'vitest';
import { computeStatus } from '../status';

describe('computeStatus', () => {
  const now = new Date('2026-02-15T12:00:00Z');

  it('returns active for commits within 7 days', () => {
    expect(computeStatus('2026-02-10T00:00:00Z', now)).toBe('active');
  });

  it('returns recent for commits within 30 days', () => {
    expect(computeStatus('2026-01-20T00:00:00Z', now)).toBe('recent');
  });

  it('returns stale for commits within 90 days', () => {
    expect(computeStatus('2025-12-01T00:00:00Z', now)).toBe('stale');
  });

  it('returns abandoned for commits older than 90 days', () => {
    expect(computeStatus('2025-01-01T00:00:00Z', now)).toBe('abandoned');
  });

  it('returns abandoned when lastCommitDate is null', () => {
    expect(computeStatus(null, now)).toBe('abandoned');
  });
});
