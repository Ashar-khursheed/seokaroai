import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <Link href="/"><Logo size={34} /></Link>
        <h1 className="mt-8 text-5xl font-semibold tracking-[-0.02em]">404</h1>
        <p className="muted mt-3 text-lg">This page does not exist, or you do not have access to it.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn">Home</Link>
          <Link href="/app" className="btn btn-primary">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
