import type { CmsDriver, ContentItem } from "./types";

/**
 * Shopify Admin REST API with a custom-app Admin API access token
 * (scopes: read_products, write_products, read_content, write_content).
 */

const VERSION = () => process.env.SHOPIFY_API_VERSION || "2025-10";

export const validShop = (s: string) => /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s);

async function shop(cfg: Record<string, string>, token: string, path: string, init: RequestInit = {}) {
  if (!validShop(cfg.shop)) throw new Error("Shop must look like your-store.myshopify.com");
  const res = await fetch(`https://${cfg.shop}/admin/api/${VERSION()}${path}`, {
    ...init,
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${JSON.stringify(data?.errors ?? text.slice(0, 200))}`);
  return data;
}

const strip = (html: string) => (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const shopify: CmsDriver = {
  kind: "shopify",
  async test(cfg, token) {
    try {
      const d = await shop(cfg, token, "/shop.json");
      return { ok: true, message: `Connected to ${d.shop?.name ?? cfg.shop}.` };
    } catch (e) {
      return { ok: false, message: String((e as Error).message) };
    }
  },
  async listContent(cfg, token, limit) {
    const out: ContentItem[] = [];
    const d = await shop(cfg, token, `/products.json?limit=${Math.min(limit, 50)}&fields=id,title,handle,body_html,images`);
    for (const p of d.products ?? []) {
      let seoTitle = "", seoDesc = "";
      try {
        const mf = await shop(cfg, token, `/products/${p.id}/metafields.json?namespace=global`);
        for (const m of mf.metafields ?? []) {
          if (m.key === "title_tag") seoTitle = m.value;
          if (m.key === "description_tag") seoDesc = m.value;
        }
      } catch { /* metafields optional */ }
      out.push({
        type: "product", id: `product:${p.id}`, label: p.title, url: `https://${cfg.shop}/products/${p.handle}`,
        fields: { title: p.title ?? "", seo_title: seoTitle, seo_description: seoDesc, body_text: strip(p.body_html).slice(0, 1500) },
        editable: ["title", "seo_title", "seo_description"],
      });
      for (const img of (p.images ?? []).slice(0, 4)) {
        out.push({
          type: "image", id: `image:${p.id}:${img.id}`, label: `${p.title} · image ${img.position ?? ""}`.trim(), url: img.src,
          fields: { alt: img.alt ?? "", product_title: p.title ?? "" }, editable: ["alt"],
        });
      }
    }
    return out;
  },
  async apply(cfg, token, resourceId, field, value) {
    const parts = resourceId.split(":");
    if (!parts.slice(1).every((x) => /^\d+$/.test(x))) throw new Error("bad id");
    if (parts[0] === "product") {
      const id = parts[1];
      const body: Record<string, unknown> = { id: Number(id) };
      if (field === "title") body.title = value;
      else if (field === "seo_title") body.metafields_global_title_tag = value;
      else if (field === "seo_description") body.metafields_global_description_tag = value;
      else throw new Error(`Field ${field} cannot be changed on products`);
      await shop(cfg, token, `/products/${id}.json`, { method: "PUT", body: JSON.stringify({ product: body }) });
      return;
    }
    if (parts[0] === "image" && field === "alt") {
      const [, pid, iid] = parts;
      await shop(cfg, token, `/products/${pid}/images/${iid}.json`, { method: "PUT", body: JSON.stringify({ image: { id: Number(iid), alt: value } }) });
      return;
    }
    throw new Error(`Unsupported change ${field} on ${parts[0]}`);
  },
};
