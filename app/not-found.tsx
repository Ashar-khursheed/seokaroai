import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 text-center">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-block"><Logo size={34} /></Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.02em] sm:mt-8 sm:text-5xl">404</h1>
        <p className="muted mt-3 text-base sm:text-lg">This page does not exist, or you do not have access to it.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn w-full justify-center sm:w-auto">Home</Link>
          <Link href="/app" className="btn btn-primary w-full justify-center sm:w-auto">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
