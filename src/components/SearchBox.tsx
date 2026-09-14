"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ initialValue = "" }: { initialValue?: string }) {
  const [q, setQ] = useState(initialValue);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث في الموقع..."
        className="w-full rounded-full border border-[var(--border)] bg-[var(--background)] py-2 px-4 pe-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      <button
        type="submit"
        aria-label="بحث"
        className="absolute inset-y-0 start-2 flex items-center text-muted"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
