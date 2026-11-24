import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: { default: "SEOKaroAI: AI SEO Audit, Rank Tracker & Competitor Analysis", template: "%s | SEOKaroAI" },
  description:
    "SEOKaroAI audits your website with a team of AI SEO agents, tracks your Google rankings daily, shows what the top 3 results do that your page does not, and fixes issues directly in WordPress, Shopify or your code.",
  applicationName: "SEOKaroAI",
  openGraph: { type: "website", siteName: "SEOKaroAI", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fbfbfc" }, { media: "(prefers-color-scheme: dark)", color: "#07070a" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
