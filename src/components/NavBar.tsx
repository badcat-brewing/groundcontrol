'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/overlaps', label: 'Overlaps' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Scan failed');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setScanning(false);
      setTimeout(() => setError(null), 4000);
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
            <button
              onClick={handleScan}
              disabled={scanning}
              className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
            {error && (
              <span className="text-sm text-red-400">{error}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
