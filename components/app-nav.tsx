"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

export interface NavItem { href: string; label: string; icon: string; badge?: string }

export function AppNav({ main, sites, account }: { main: NavItem[]; sites: NavItem[]; account: NavItem[] }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path === href || path.startsWith(href + "/") || path.startsWith(href + "?"));
  const item = (n: NavItem) => (
    <Link key={n.href} href={n.href}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] transition ${active(n.href) ? "bg-[var(--panel2)] font-medium text-[var(--ink)]" : "muted hover:bg-[var(--panel2)] hover:text-[var(--ink)]"}`}>
      <Icon name={n.icon} size={16} className={active(n.href) ? "text-brand-500" : "opacity-80 group-hover:opacity-100"} />
      <span className="truncate">{n.label}</span>
      {n.badge && <span className="ml-auto rounded-md bg-[var(--panel2)] px-1.5 text-[10.5px] font-medium text-[var(--muted)] ring-1 ring-[var(--line)]">{n.badge}</span>}
    </Link>
  );
  return (
    <nav className="space-y-6" aria-label="App">
      <div className="space-y-0.5">{main.map(item)}</div>
      <div>
        <div className="muted mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider">Websites</div>
        <div className="space-y-0.5">{sites.map(item)}</div>
      </div>
      <div>
        <div className="muted mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider">Account</div>
        <div className="space-y-0.5">{account.map(item)}</div>
      </div>
    </nav>
  );
}
