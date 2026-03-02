'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useScanProgress } from '@/hooks/useScanProgress';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/overlaps', label: 'Overlaps' },
];

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m${seconds % 60}s` : `${seconds}s`;
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const scan = useScanProgress();
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear done/error status after 5s
  useEffect(() => {
    if (scan.phase === 'done' || scan.phase === 'error') {
      clearTimerRef.current = setTimeout(() => scan.reset(), 5000);
      return () => {
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      };
    }
  }, [scan.phase, scan.reset]);

  // Refresh dashboard data on done
  useEffect(() => {
    if (scan.phase === 'done') {
      router.refresh();
    }
  }, [scan.phase, router]);

  const progress = scan.total > 0 ? scan.current / scan.total : 0;

  let buttonText = 'Scan Now';
  if (scan.isScanning) {
    if (scan.phase === 'fetching') {
      buttonText = `Fetching ${scan.current}/${scan.total}...`;
    } else if (scan.phase === 'enriching') {
      buttonText = `Enriching ${scan.current}/${scan.total}...`;
    } else if (scan.phase === 'writing') {
      buttonText = 'Writing...';
    } else {
      buttonText = 'Scanning...';
    }
  }

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-mono text-sm font-bold tracking-wider uppercase text-white">
            Project PM
          </Link>
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium pb-0.5 ${
                  pathname === link.href
                    ? 'text-white border-b-2 border-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/api/export"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Export
            </a>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={scan.startScan}
                  disabled={scan.isScanning}
                  className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
                >
                  {buttonText}
                </button>
                {scan.isScanning && (scan.phase === 'fetching' || scan.phase === 'enriching') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700 rounded-b-md overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-300"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
              {scan.isScanning && scan.repoName && (
                <span className="text-xs text-slate-400 max-w-[150px] truncate">
                  {scan.repoName}
                </span>
              )}
              {scan.phase === 'done' && scan.projectCount !== null && (
                <span className="text-xs text-emerald-400">
                  {scan.projectCount} projects ({formatDuration(scan.durationMs!)})
                </span>
              )}
              {scan.phase === 'error' && scan.error && (
                <span className="text-xs text-red-400">{scan.error}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
