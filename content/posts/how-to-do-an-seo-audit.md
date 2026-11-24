---
title: How to Do an SEO Audit: A Practical Checklist for 2026
slug: how-to-do-an-seo-audit
excerpt: A step-by-step SEO audit checklist covering crawling, indexing, on-page SEO, content quality, structured data, speed and AI search, with what to fix first.
metaTitle: How to Do an SEO Audit in 2026: Step-by-Step Checklist
metaDescription: Learn how to do an SEO audit step by step: crawlability, indexing, on-page SEO, content, schema, Core Web Vitals and AI search readiness, plus how to prioritise fixes.
focusKeyword: seo audit
tags: SEO audit, Technical SEO, Checklist
---

An SEO audit answers one question: **what is stopping this website from getting more organic traffic, and what should we fix first?** A good audit is not a list of every warning a tool can produce. It is a short, ordered plan backed by evidence.

This checklist walks through the same order we use in [SEOKaroAI's AI SEO audit](/features/ai-seo-audit). Work top to bottom: problems higher up block everything below them.

## 1. Can search engines crawl the site?

If Google cannot reach a page, nothing else about that page matters.

- **robots.txt:** open `yourdomain.com/robots.txt`. Make sure it does not block important folders, and that it lists your sitemap. A robots.txt that returns a server error (5xx) tells Google to stop crawling the whole site.
- **Server responses:** important pages should return `200`. Moved pages should `301` redirect in a single hop. Pages that no longer exist should return a real `404`, not a "page not found" message with a `200` status (a soft 404).
- **Internal links:** every page you want to rank needs links from other pages on your site. Pages with no internal links ("orphan pages") are often never found, even when they are in the sitemap.

## 2. Are the right pages indexed?

- **XML sitemap:** list every page you want indexed and nothing else. Do not include redirects, `noindex` pages or login areas. Submit it in Google Search Console and Bing Webmaster Tools.
- **noindex and canonical tags:** check that money pages do not carry `noindex` by mistake, and that each page's canonical points to itself (or to the real original if it is a duplicate).
- **App and account areas:** dashboards, carts and login pages should be `noindex`. They waste crawl budget and can look like thin content.

In Search Console, the *Pages* report shows which URLs are indexed and why the others are not. "Crawled, currently not indexed" usually means Google did not find the page valuable enough, which is a content problem, not a technical one.

## 3. On-page basics on every important page

For each page that should rank:

- One clear **title tag** of roughly 30 to 60 characters that contains the main keyword, with the brand at the end (not twice).
- A **meta description** of about 120 to 160 characters that makes someone want to click.
- A single **H1** that says what the page is about, and **H2s** that match the questions searchers have.
- Descriptive **alt text** on meaningful images.
- A clean, readable **URL**.

These rarely move rankings alone, but missing or duplicated titles across hundreds of pages are a common and easy win.

## 4. Content quality and E-E-A-T

Google's quality guidelines ask whether content shows **experience, expertise, authoritativeness and trust (E-E-A-T)**. In practice, check for:

- **Thin pages:** category or service pages with a sentence or two of text.
- **Unsupported claims:** "340% more leads" with no source or case study hurts trust more than it helps.
- **Who is behind the site:** an About page with real people, a physical address, and named authors on articles.
- **Search intent match:** if Google ranks comparison guides for your keyword and you have a product page, you need a different page type, not more keywords.

## 5. Structured data

Structured data (schema.org JSON-LD) helps search engines understand your pages and can earn rich results. Check that:

- **Organization** markup uses a real logo image (PNG or JPG, not SVG) and links your social profiles in `sameAs`.
- **Product** and **Offer** markup shows the same price as the page.
- **Article/BlogPosting** markup names a real author.
- Nothing is marked up that is not visible on the page.

## 6. Speed and Core Web Vitals

Core Web Vitals measure real user experience:

| Metric | What it measures | Good |
|---|---|---|
| LCP | How fast the main content appears | ≤ 2.5 s |
| INP | How fast the page responds to clicks and taps | ≤ 200 ms |
| CLS | How much the layout jumps while loading | ≤ 0.1 |

Common fixes: compress and size images, self-host fonts and load fewer weights, remove unused JavaScript, and give images and embeds fixed dimensions.

## 7. AI search readiness

More searches now end in an AI answer. To be quoted by Google AI Overviews, ChatGPT or Perplexity:

- Do not block AI crawlers by accident in robots.txt or your firewall.
- Put direct answers in the HTML (not only behind "click to expand").
- Use question-style headings followed by a short, self-contained answer.
- Cite sources for statistics.

Read more in our guide to [AI search optimization](/features/ai-search-optimization).

## 8. Compare yourself with who actually ranks

The most useful part of an audit is often outside your own site. Search your top keywords and look at the top three results: how long are they, what subtopics do they cover, what page type are they? Our [Keyword Battle](/features/keyword-battle) does this measurement for you and lists the gaps.

## How to prioritise the fixes

Sort every issue into four buckets:

1. **Critical:** blocks crawling or indexing (robots errors, noindex on money pages, missing sitemap, orphan pages).
2. **High:** clearly hurts rankings (thin money pages, wrong page type for the intent, broken canonicals).
3. **Medium:** optimisation opportunities (titles, schema, speed).
4. **Low:** nice to have.

Fix in that order, and for every fix write down how you will know it worked, for example "indexed pages in Search Console rise from 12 to 50 within six weeks".

## Run your audit automatically

You can work through this checklist by hand, or let SEOKaroAI run it: a quick audit covers 47 on-page checks plus security, sitemaps and AI readiness in a few minutes, and the AI deep audit adds content, competitors and a 90-day plan. [Start free](/signup).
