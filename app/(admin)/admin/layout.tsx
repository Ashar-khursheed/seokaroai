import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";

export const metadata = { title: { default: "Admin", template: "%s · Admin | SEOKaroAI" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [["/admin", "Overview"], ["/admin/integrations", "Integrations"], ["/admin/agents", "Agents"], ["/admin/users", "Users"], ["/admin/runs", "Runs"], ["/admin/posts", "Blog posts"], ["/admin/messages", "Messages"], ["/admin/emails", "Email log"], ["/admin/settings", "Settings"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b line" style={{ background: "var(--panel)" }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="mr-3 flex items-center gap-2"><Logo size={26} /><span className="rounded bg-amber-400 px-1.5 text-xs font-bold text-black">ADMIN</span></Link>
          <nav className="flex flex-wrap gap-1 text-sm">{NAV.map(([h, l]) => <Link key={h} href={h} className="rounded-lg px-3 py-1.5 hover:bg-[var(--panel2)]">{l}</Link>)}</nav>
          <Link href="/app" className="btn ml-auto !py-1.5 text-sm">← Back to app</Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
