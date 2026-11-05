"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <header className="nav-blur sticky top-0 z-40">
      <nav className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-6">
        <Link href="/" className="text-gradient text-[1.05rem] font-bold tracking-tight">
          KAIRO&apos;S HOUSEPARTY
        </Link>
        <div className="flex items-center gap-7 text-[0.82rem] text-ink">
          <Link href="/songs" className="opacity-80 transition hover:opacity-100">
            Song Lists
          </Link>
          <Link href="/playlists" className="opacity-80 transition hover:opacity-100">
            Playlists
          </Link>
          <Link href="/#build" className="btn-party rounded-full px-3.5 py-1.5 transition hover:opacity-90">
            Build a set
          </Link>
        </div>
      </nav>
    </header>
  );
}
