'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const navigation = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/products', label: 'Products' },
  { href: '/delivery-pincodes', label: 'Delivery PIN codes' },
];

export default function AdminHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleSignOut() {
    setSigningOut(true);
    setLogoutError('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLogoutError(error.message);
      setSigningOut(false);
      return;
    }
    router.replace('/login');
    router.refresh();
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 text-gray-900 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Fresh Basket Admin home">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M4 9h16l-1.6 10H5.6L4 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m8 9 4-5 4 5M8 12v4m4-4v4m4-4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-base font-extrabold tracking-tight text-gray-900 sm:text-lg">Fresh Basket</span>
            <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">Admin console</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">Administrator</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav id="admin-mobile-menu" aria-label="Mobile navigation" className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 px-4 pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">Administrator</span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
    <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {logoutError && <p role="alert" className="mx-auto max-w-7xl px-4 pt-3 text-sm text-red-700 sm:px-6">Could not sign out: {logoutError}</p>}
    </>
  );
}
