export type ScanProgressEvent =
  | { phase: 'fetching'; current: number; total: number; repoName: string }
  | { phase: 'enriching'; current: number; total: number; repoName: string }
  | { phase: 'writing'; message: string }
  | { phase: 'done'; projectCount: number; durationMs: number }
  | { phase: 'error'; message: string };

export type OnProgress = (event: ScanProgressEvent) => void;
