import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import { userProjects } from "@/lib/queries";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { AppNav, type NavItem } from "@/components/app-nav";
import { ActionForm, SubmitButton } from "@/components/client";
import { MobileDrawer } from "@/components/mobile-drawer";
import { logout } from "@/app/(auth)/actions";
import { resendVerification } from "./actions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | SEOKaroAI" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const plan = effectivePlan(user);
  const projects = await userProjects(user.id);
  const main: NavItem[] = [
    { href: "/app", label: "Overview", icon: "LayoutDashboard" },
    { href: "/app/battles/new", label: "Keyword battle", icon: "Swords" },
    { href: "/app/runs", label: "Reports", icon: "FileText" },
  ];
  const sites: NavItem[] = [
    ...projects.map((p) => ({ href: `/app/projects/${p.id}`, label: p.name, icon: "Globe", badge: p.lastScore != null ? String(p.lastScore) : undefined })),
    { href: "/app/projects/new", label: "Add website", icon: "Plus" },
  ];
  const account: NavItem[] = [
    { href: "/app/billing", label: "Billing", icon: "CreditCard", badge: plan.name },
    { href: "/app/settings", label: "Settings", icon: "Settings" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin", icon: "ShieldCheck" }] : []),
  ];
  const initials = (user.name || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const userBox = (
    <div className="flex items-center gap-3 border-t line p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-400 text-[12px] font-semibold text-white">{initials}</span>
      <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{user.name || "Account"}</div><div className="muted truncate text-[11.5px]">{user.email}</div></div>
      <form action={logout}><button className="btn btn-ghost !p-1.5" title="Log out" aria-label="Log out"><Icon name="LogOut" size={15} /></button></form>
    </div>
  );
  const nav = <AppNav main={main} sites={sites} account={account} />;
  const upgrade = plan.code === "free" && (
    <Link href="/app/billing" className="mx-3 mb-3 block rounded-xl border line p-3 text-[12.5px] transition hover:border-[var(--line-strong)]">
      <div className="flex items-center gap-2 font-medium"><Icon name="Zap" size={14} className="text-brand-500" />Upgrade to Starter</div>
      <div className="muted mt-1">AI deep audits, daily rank tracking and more websites.</div>
    </Link>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r line lg:flex" style={{ background: "var(--bg-elev)" }}>
        <div className="flex h-14 items-center px-4"><Link href="/app"><Logo size={22} /></Link></div>
        <div className="flex-1 overflow-y-auto px-2.5 py-3">{nav}</div>
        {upgrade}
        {userBox}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b line px-4 backdrop-blur-xl lg:hidden" style={{ background: "color-mix(in oklab, var(--bg) 80%, transparent)" }}>
          <Link href="/app"><Logo size={22} /></Link>
          <Link href="/app/projects/new" className="btn ml-auto !px-2.5 sm:!px-3" aria-label="Add website"><Icon name="Plus" size={16} /><span className="hidden sm:inline">Add website</span></Link>
          <MobileDrawer title={<Logo size={22} />}>
            <div className="flex-1 px-2.5 py-3">{nav}</div>
            {upgrade}
            {userBox}
          </MobileDrawer>
        </header>
        {!user.emailVerifiedAt && (
          <div className="border-b border-high/30 bg-high/10 px-4 py-2.5 text-[13px]">
            <ActionForm action={resendVerification} className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-2">
              <Icon name="Mail" size={15} className="shrink-0 text-high" />
              <span className="min-w-0 break-words">Confirm <b className="break-all">{user.email}</b> to start running audits.</span>
              <SubmitButton className="btn !py-1 text-xs" pendingText="Sending…">Resend email</SubmitButton>
            </ActionForm>
          </div>
        )}
        <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
