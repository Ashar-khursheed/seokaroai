# SEOKaroAI

SaaS for **seokaroai.com**: AI SEO audits, keyword battles (your page vs the top 3), daily rank tracking,
automated reports and emails, a blog CMS, and Paddle subscriptions. Built with Next.js 16, MySQL/MariaDB
(Drizzle ORM), the Claude Agent SDK and the Claude SEO toolkit in this repository.

## What is inside

| Area | Details |
|---|---|
| Marketing site | Home, pricing, 6 feature pages (one search intent each), blog, about, contact, legal. Metadata, canonicals, JSON-LD (Organization, WebSite, SoftwareApplication + Offers, BlogPosting, BreadcrumbList), `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, RSS, OG image, manifest, logo |
| Accounts | Sign-up, email confirmation, login with rate limits, forgot/reset password, sessions (hashed tokens, httpOnly cookie), change password, delete account |
| Plans | Free / Starter $39 / Pro $99 / Agency $249 in `lib/plans.ts`: websites, site audits, AI deep audits, keyword battles, tracked keywords, rank frequency, automatic audits, spend cap per AI run |
| Billing | Paddle Billing overlay checkout, signed `customData`, verified and idempotent webhooks, customer portal for card changes, cancellation and invoices |
| Engines | **Site audit** (bundled scripts, no AI, about 30 s), **AI deep audit** (the agent team via Agent SDK, 15–40 min), **Keyword battle** (Agent SDK), **rank tracking** (DataForSEO, top 100) |
| Automations | A background worker (started from `instrumentation.ts`) runs the queue, scheduled audits (weekly/monthly), rank checks (daily/weekly), rank-move alerts and the Monday weekly report |
| Emails | Confirmation, password reset, report ready, ranking alerts, weekly report, plan changed, contact form. SMTP, or `data/outbox/*.eml` in development |
| Customer app | Dashboard, websites with score history and ranking status, rankings table (position, change, best, 30-day trend, ranking URL, who holds #1), report viewers, billing and usage, settings |
| AI providers | Anthropic Claude (Agent SDK, full sub-agent team) or OpenAI (Responses API agent with the same tools). Switch in Admin → Settings |
| Connect & Fix | WordPress (Application Password), Shopify (Admin API token), GitHub (fine-grained token, pull requests only) and, self-hosted, a server folder. AI proposes changes; you review old vs new or a line diff, apply, and undo. Secrets are AES-256-GCM encrypted |
| Admin `/admin` | MRR, AI and data cost, margin, setup checklist, users (plan override, suspend), runs, blog editor with live SEO checklist and scheduling, contact messages, email log |

## Run it locally (Windows + XAMPP)

```powershell
cd F:\claude-seo\studio
npm install
copy .env.example .env.local      # then fill in the values (see below)
npm run setup                     # creates the database, applies migrations, adds the starter blog posts
npm run build
npm start                         # http://localhost:3100
```

Create the super admin with `npm run create-admin` (credentials are written to `data/ADMIN-ACCOUNT.md`), or sign up with an email listed in `ADMIN_EMAILS`. Without SMTP, open the confirmation
email from `data\outbox\`.

Requirements: Node 20+, MySQL 8 or MariaDB 10.4+, the Claude SEO skill installed in the server user's
`~/.claude` (`/seo setup` done), and on Windows, Git for Windows (the agents' shell runs in Git Bash).

## Settings (`.env.local`)

| Setting | Needed for |
|---|---|
| `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, `ADMIN_EMAILS` | Always |
| `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` | AI deep audits, keyword battles and auto-fix |
| `ENCRYPTION_KEY` | Encrypting connector credentials (falls back to `SESSION_SECRET`) |
| `ALLOW_LOCAL_FOLDERS=1` | Self-hosted only: admins can connect a folder on the server |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | Rank tracking and the live Google top 10 in keyword battles |
| `GOOGLE_API_KEY` | Performance (Lighthouse) scores in site audits |
| `SMTP_*`, `MAIL_FROM` | Sending real emails |
| `PADDLE_*`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Taking payments |

Admin → Overview shows a setup checklist of what is configured.

## Going live checklist

1. **Server:** a Linux VPS (2 vCPU / 4 GB RAM or more). Install Node 20+, Python 3.11+, MySQL 8, and the Claude SEO
   skill for the user that runs the app. Put Caddy or Nginx in front for HTTPS.
2. **Database:** create a MySQL user for `seokaroai`, set `DATABASE_URL`, run `npm run setup`.
3. **Paddle:** create products Starter, Pro and Agency, each with a monthly and a yearly price matching
   `lib/plans.ts`. Copy the price IDs, API key, client-side token and webhook secret into `.env.local`.
   Notification destination: `https://seokaroai.com/api/webhooks/paddle`, events `subscription.*`.
   Approve the domain in Paddle and keep the Terms, Privacy and Refund pages live (Paddle checks them).
4. **Email:** use a transactional provider (Amazon SES, Postmark, Brevo, Resend SMTP). Add SPF, DKIM and DMARC
   records for seokaroai.com so emails land in the inbox.
5. **Data:** DataForSEO account for rank tracking. Google Cloud API key with PageSpeed Insights enabled.
6. **Run:** `npm run build`, then keep `npm start` running with systemd or pm2. Only one process should have
   `WORKER_ENABLED=1`.
7. **Search engines:** add seokaroai.com to Google Search Console and Bing Webmaster Tools and submit
   `https://seokaroai.com/sitemap.xml`.
8. **Legal:** have the Terms, Privacy and Refund pages (`lib/content/legal.ts`) reviewed for your jurisdiction.

## Costs and margins

AI runs cost real API money, so every plan caps them and every run has a spend cap (`deepBudgetUsd`,
`battleBudgetUsd` in `lib/plans.ts`). Failed and cancelled runs do not count against a customer's allowance.
Watch **Admin → Overview → AI + data cost** and the margin estimate, and adjust limits or prices in `lib/plans.ts`.

## Safety

Agents read untrusted web pages, so every tool call goes through `lib/guard.ts`: writes only inside the run
folder, shell limited to the claude-seo launcher, curl and read-only utilities, no installs, git, deletes or
PowerShell. Customer URLs are checked to be public before they are stored (`lib/url-safety.ts`), and the
Python tools re-check every request. Run files are served only to their owner, agent-written HTML is sandboxed
with a CSP header, and markdown is rendered with raw HTML escaped.

## Layout

```
app/(marketing)   public site and blog        app/(app)/app   customer dashboard
app/(auth)        sign-up, login, reset       app/(admin)     admin panel
app/api           run events, files, Paddle   lib/            db, auth, plans, engines, worker, emails
migrations/       SQL schema                  content/posts/  starter blog posts (npm run db:seed)
```
