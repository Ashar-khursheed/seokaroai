/**
 * Legal pages in Markdown. These are starting templates written for a subscription SaaS sold
 * through Paddle (merchant of record). Have them reviewed for your jurisdiction before launch.
 */

const updated = "November 24, 2026";

export const LEGAL: Record<string, { title: string; description: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    description: "How SEOKaroAI collects, uses and protects your personal data.",
    body: `_Last updated: ${updated}_

## Who we are
SEOKaroAI ("we", "us") provides an online SEO auditing, rank tracking and reporting service at seokaroai.com. Contact: support@seokaroai.com.

## What we collect
- **Account data:** your name, email address and a one-way hash of your password.
- **Project data:** the website URLs, keywords, countries and settings you add, and the reports our service generates for them.
- **Billing data:** subscriptions are sold by our reseller Paddle.com, which acts as Merchant of Record. Paddle processes your payment details; we receive your subscription status, plan and a customer reference, never your full card number.
- **Usage and security data:** sign-in times, IP address and browser user agent for active sessions, and logs of emails we send you.

## How we use it
To provide the service (run audits, track rankings, send reports and alerts), to secure your account, to bill your subscription through Paddle, and to answer support requests. We do not sell personal data and we do not use your project data to advertise to you.

## Service providers
We share the minimum data needed with: Paddle (billing), our email delivery provider, our hosting provider, Anthropic (AI processing of public web pages and your audit instructions), and search data providers used for rank tracking (the keywords and markets you track).

## Retention
Account and project data are kept while your account is open. When you delete your account we delete your projects, reports and sessions within 30 days, except records we must keep for tax or legal reasons.

## Your rights
You can access, correct, export or delete your data from your account settings or by emailing support@seokaroai.com. Depending on where you live (for example under the GDPR or UK GDPR) you may also object to or restrict processing, and complain to your data protection authority.

## Cookies
We use one essential, first-party session cookie to keep you signed in. Paddle's checkout may set its own cookies when you open it. We do not use advertising cookies.

## Security
Passwords are hashed with scrypt, sessions use random tokens stored as hashes, and all traffic is served over HTTPS.

## Changes
We will post changes on this page and, for significant changes, email account holders.`,
  },
  terms: {
    title: "Terms of Service",
    description: "The terms that apply when you use SEOKaroAI.",
    body: `_Last updated: ${updated}_

## 1. The service
SEOKaroAI provides software that audits websites, tracks search rankings and generates SEO reports and recommendations. Reports are generated automatically, partly by AI systems, and are advice, not guarantees of rankings or traffic.

## 2. Your account
You must give accurate information, keep your password secure and be at least 18. You are responsible for activity under your account.

## 3. Acceptable use
Only audit websites you own or are authorised to analyse. Do not use the service to attack, overload or scrape websites in breach of their terms, to resell raw data in bulk, or to break the law. We may suspend accounts that do.

## 4. Plans, billing and renewals
Paid plans are billed in advance, monthly or yearly, by our reseller Paddle.com, the Merchant of Record for all orders. Paddle provides customer service for billing enquiries and handles returns. Subscriptions renew automatically until cancelled. Plan limits (websites, audits, keyword battles, tracked keywords) reset on the first day of each calendar month (UTC).

## 5. Cancellation
You can cancel anytime from the billing page. Your plan stays active until the end of the paid period and then moves to the Free plan.

## 6. Refunds
See our [Refund Policy](/legal/refund).

## 7. Your content
You keep all rights to your websites, keywords and reports. You give us permission to process them only to provide the service.

## 8. Availability and changes
We aim for high availability but do not guarantee uninterrupted service. We may change features; we will give notice of material changes that reduce paid features.

## 9. Liability
To the extent permitted by law, the service is provided "as is", and our total liability is limited to the amount you paid in the 12 months before the claim. We are not liable for lost profits, rankings or traffic.

## 10. Contact
support@seokaroai.com`,
  },
  refund: {
    title: "Refund Policy",
    description: "When and how you can get a refund for SEOKaroAI.",
    body: `_Last updated: ${updated}_

Orders are processed by Paddle.com, our Merchant of Record.

## 14-day refund
If you are not happy with a new paid subscription, request a refund within 14 days of the first payment and we will refund it in full, no questions asked.

## Renewals
Renewal payments can be refunded within 7 days of the renewal date if you have not run any AI deep audits or keyword battles in the new period.

## How to ask
Email support@seokaroai.com from your account email, or reply to your Paddle receipt. Refunds go back to the original payment method through Paddle, usually within 5 to 10 business days.

## Cancelling instead
You can cancel anytime from the billing page; you keep access until the end of the paid period.`,
  },
};
