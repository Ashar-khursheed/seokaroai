export type ConnectorKind = "wordpress" | "shopify" | "github" | "local" | "folder";

/** A piece of CMS content the AI may propose changes to. `fields` holds the current values. */
export interface ContentItem {
  type: string; // page | post | product | collection | image | media
  id: string; // driver-specific id, e.g. "page:12" or "image:123:456"
  label: string;
  url?: string;
  fields: Record<string, string>;
  editable: string[]; // field names the driver can write
}

export interface TestResult { ok: boolean; message: string }

export interface CmsDriver {
  kind: "wordpress" | "shopify";
  test(cfg: Record<string, string>, secret: string): Promise<TestResult>;
  listContent(cfg: Record<string, string>, secret: string, limit: number): Promise<ContentItem[]>;
  apply(cfg: Record<string, string>, secret: string, resourceId: string, field: string, value: string): Promise<void>;
}

export interface ChangedFile { path: string; content: string | null } // null = deleted

export interface CodeDriver {
  kind: "github" | "folder";
  test(cfg: Record<string, string>, secret: string): Promise<TestResult>;
  /** Copy the code into `dest` (a folder that does not exist yet). */
  fetchCode(cfg: Record<string, string>, secret: string, dest: string): Promise<void>;
}

export const CONNECTOR_INFO: Record<ConnectorKind, { label: string; blurb: string }> = {
  wordpress: { label: "WordPress", blurb: "Fix titles, excerpts and image alt text through the WordPress REST API (Application Password)." },
  shopify: { label: "Shopify", blurb: "Fix product titles, SEO titles, meta descriptions and image alt text through the Admin API." },
  github: { label: "GitHub repository", blurb: "AI edits the code (meta tags, canonicals, sitemap, schema, alt text) and opens a pull request for you to review." },
  local: { label: "Computer folder", blurb: "Pick your website folder in the browser (Chrome or Edge). AI fixes a copy; you review the diff and the browser writes approved changes back, with a backup." },
  folder: { label: "Server folder", blurb: "Self-hosted only: AI edits a copy of a folder on this server; you review the diff and apply it with a backup." },
};
