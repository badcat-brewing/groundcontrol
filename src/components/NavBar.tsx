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
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Project PM
          </Link>
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium pb-0.5 ${
                  pathname === link.href
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/api/export"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Export
            </a>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </button>
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
