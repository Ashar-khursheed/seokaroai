import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { SeoKaroChatbot } from "@/components/chatbot";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn">Skip to content</a>

      {/* Static links for parsers and crawlers (noscript ensures they are present in the static HTML even if JS-driven nav is used) */}
      <noscript>
        <nav aria-label="Static internal links">
          <a href="/">Home</a> | <a href="/features">Features</a> | <a href="/pricing">Pricing</a> | <a href="/blog">Blog</a> | <a href="/about">About</a> | <a href="/contact">Contact</a> | <a href="/sitemap.xml">Sitemap</a> | <a href="/llms.txt">llms.txt</a>
        </nav>
      </noscript>

      <MarketingHeader />
      <main id="main">{children}</main>
      <MarketingFooter />
      <SeoKaroChatbot />
    </>
  );
}
