import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";

export const metadata = { title: { default: "Admin", template: "%s · Admin | SEOKaroAI" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: [string, string][] = [["/admin", "Overview"], ["/admin/integrations", "Integrations"], ["/admin/agents", "Agents"], ["/admin/users", "Users"], ["/admin/runs", "Runs"], ["/admin/posts", "Blog posts"], ["/admin/messages", "Messages"], ["/admin/emails", "Email log"], ["/admin/settings", "Settings"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b line backdrop-blur-xl" style={{ background: "color-mix(in oklab, var(--panel) 88%, transparent)" }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 pt-3 sm:px-6 xl:py-3">
          <Link href="/admin" className="mr-1 flex shrink-0 items-center gap-2"><Logo size={24} /><span className="rounded bg-amber-400 px-1.5 text-xs font-bold text-black">ADMIN</span></Link>
          <AdminNav items={NAV} className="hidden xl:flex" />
          <Link href="/app" className="btn ml-auto shrink-0 !py-1.5 text-sm">← <span className="hidden sm:inline">Back to app</span><span className="sm:hidden">App</span></Link>
        </div>
        <div className="mx-auto max-w-[1400px] px-2 pb-2 pt-2 sm:px-4 xl:hidden">
          <AdminNav items={NAV} className="flex" />
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
