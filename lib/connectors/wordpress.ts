import type { CmsDriver, ContentItem } from "./types";

/** WordPress REST API with an Application Password (Users → Profile → Application Passwords). */

const base = (cfg: Record<string, string>) => cfg.siteUrl.replace(/\/+$/, "") + "/wp-json/wp/v2";
const auth = (cfg: Record<string, string>, secret: string) => "Basic " + Buffer.from(`${cfg.username}:${secret.replace(/\s+/g, "")}`).toString("base64");

async function wp(cfg: Record<string, string>, secret: string, path: string, init: RequestInit = {}) {
  const res = await fetch(base(cfg) + path, {
    ...init,
    headers: { Authorization: auth(cfg, secret), "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) throw new Error(`WordPress ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data;
}

const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const wordpress: CmsDriver = {
  kind: "wordpress",
  async test(cfg, secret) {
    try {
      const me = await wp(cfg, secret, "/users/me?context=edit");
      const canEdit = me?.capabilities?.edit_pages || me?.capabilities?.edit_posts;
      return canEdit ? { ok: true, message: `Connected as ${me.name}.` } : { ok: false, message: `Connected as ${me.name}, but this user cannot edit content.` };
    } catch (e) {
      return { ok: false, message: String((e as Error).message) };
    }
  },
  async listContent(cfg, secret, limit) {
    const out: ContentItem[] = [];
    for (const type of ["pages", "posts"]) {
      const items: any[] = await wp(cfg, secret, `/${type}?per_page=${Math.min(limit, 50)}&context=edit&status=publish&_fields=id,link,title,excerpt,content,yoast_head_json`);
      for (const it of items) {
        out.push({
          type: type.slice(0, -1), id: `${type.slice(0, -1)}:${it.id}`, label: strip(it.title?.raw ?? it.title?.rendered ?? "") || `#${it.id}`, url: it.link,
          fields: {
            title: it.title?.raw ?? "", excerpt: it.excerpt?.raw ?? "",
            seo_title_current: it.yoast_head_json?.title ?? "", meta_description_current: it.yoast_head_json?.description ?? "",
            body_text: strip(it.content?.raw ?? it.content?.rendered ?? "").slice(0, 1500),
          },
          editable: ["title", "excerpt"],
        });
      }
    }
    const media: any[] = await wp(cfg, secret, `/media?per_page=${Math.min(limit, 100)}&context=edit&media_type=image&_fields=id,source_url,alt_text,title,post`);
    for (const m of media) {
      out.push({
        type: "image", id: `media:${m.id}`, label: m.source_url?.split("/").pop() ?? `image ${m.id}`, url: m.source_url,
        fields: { alt_text: m.alt_text ?? "", file_title: m.title?.raw ?? "" }, editable: ["alt_text"],
      });
    }
    return out;
  },
  async apply(cfg, secret, resourceId, field, value) {
    const [type, id] = resourceId.split(":");
    if (!/^\d+$/.test(id)) throw new Error("bad id");
    if (type === "media" && field === "alt_text") {
      await wp(cfg, secret, `/media/${id}`, { method: "POST", body: JSON.stringify({ alt_text: value }) });
      return;
    }
    if ((type === "page" || type === "post") && (field === "title" || field === "excerpt")) {
      await wp(cfg, secret, `/${type}s/${id}`, { method: "POST", body: JSON.stringify({ [field]: value }) });
      return;
    }
    throw new Error(`Field ${field} on ${type} cannot be changed through WordPress`);
  },
};
