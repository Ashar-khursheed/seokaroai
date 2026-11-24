import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";

const POINTS = [
  { icon: "BrainCircuit", t: "A team of AI agents", d: "Technical, content, schema, speed, AI search and competitors, audited in parallel." },
  { icon: "Swords", t: "Evidence, not opinions", d: "Every recommendation cites what a ranking competitor actually does." },
  { icon: "WandSparkles", t: "Fixes that ship", d: "Approve changes and apply them to WordPress, Shopify or a GitHub pull request." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/" aria-label="SEOKaroAI home"><Logo size={26} /></Link>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="animate-fade-up w-full max-w-[400px]">{children}</div>
        </main>
        <footer className="muted text-[12px]">
          <Link href="/legal/privacy" className="hover:text-[var(--ink)]">Privacy</Link> · <Link href="/legal/terms" className="hover:text-[var(--ink)]">Terms</Link>
        </footer>
      </div>
      <aside className="relative hidden overflow-hidden border-l line lg:block" style={{ background: "var(--bg-elev)" }}>
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="glow-top pointer-events-none absolute inset-0" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <h2 className="text-gradient max-w-md text-4xl font-semibold leading-[1.1] tracking-[-0.04em]">The SEO team that never sleeps.</h2>
          <ul className="mt-10 max-w-md space-y-7">
            {POINTS.map((p, i) => (
              <li key={p.t} className="animate-fade-up flex gap-4" style={{ animationDelay: `${150 + i * 120}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border line bg-[var(--panel)] text-brand-500"><Icon name={p.icon} size={18} /></span>
                <span><span className="block font-medium">{p.t}</span><span className="muted mt-1 block text-[14px] leading-relaxed">{p.d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
