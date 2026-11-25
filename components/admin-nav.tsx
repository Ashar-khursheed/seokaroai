"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ items, className = "" }: { items: [string, string][]; className?: string }) {
  const path = usePathname();
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path === h || path.startsWith(h + "/"));
  return (
    <nav aria-label="Admin" className={`no-scrollbar min-w-0 gap-1 overflow-x-auto text-sm ${className}`}>
      {items.map(([h, l]) => (
        <Link key={h} href={h} aria-current={active(h) ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 transition ${active(h) ? "bg-[var(--panel2)] font-medium text-[var(--ink)]" : "muted hover:bg-[var(--panel2)] hover:text-[var(--ink)]"}`}>
          {l}
        </Link>
      ))}
    </nav>
  );
}
