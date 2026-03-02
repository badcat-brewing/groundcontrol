'use client';

import { useState, useRef, useCallback } from 'react';
import type { ScanProgressEvent } from '../../scanner/progress';

interface ScanState {
  isScanning: boolean;
  phase: ScanProgressEvent['phase'] | null;
  current: number;
  total: number;
  repoName: string | null;
  message: string | null;
  error: string | null;
  projectCount: number | null;
  durationMs: number | null;
}

const initialState: ScanState = {
  isScanning: false,
  phase: null,
  current: 0,
  total: 0,
  repoName: null,
  message: null,
  error: null,
  projectCount: null,
  durationMs: null,
};

export function useScanProgress() {
  const [state, setState] = useState<ScanState>(initialState);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startScan = useCallback(() => {
    if (eventSourceRef.current) return;

    setState({ ...initialState, isScanning: true });

    const es = new EventSource('/api/scan');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: ScanProgressEvent = JSON.parse(event.data);
        switch (data.phase) {
          case 'fetching':
            setState(s => ({ ...s, phase: 'fetching', current: data.current, total: data.total, repoName: data.repoName }));
            break;
          case 'enriching':
            setState(s => ({ ...s, phase: 'enriching', current: data.current, total: data.total, repoName: data.repoName }));
            break;
          case 'writing':
            setState(s => ({ ...s, phase: 'writing', message: data.message }));
            break;
          case 'done':
            setState(s => ({ ...s, isScanning: false, phase: 'done', projectCount: data.projectCount, durationMs: data.durationMs }));
            es.close();
            eventSourceRef.current = null;
            break;
          case 'error':
            setState(s => ({ ...s, isScanning: false, phase: 'error', error: data.message }));
            es.close();
            eventSourceRef.current = null;
            break;
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      setState(s => ({ ...s, isScanning: false, phase: 'error', error: 'Connection lost' }));
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, startScan, reset };
}
