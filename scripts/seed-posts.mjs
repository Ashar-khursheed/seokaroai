#!/usr/bin/env node
/**
 * Insert the starter blog posts from content/posts/*.md (front matter + Markdown) as published
 * posts. Existing slugs are skipped, so it is safe to run more than once.
 * Usage: node scripts/seed-posts.mjs   Output: one JSON line per post.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnv } from "./env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
if (!process.env.DATABASE_URL) {
  console.log(JSON.stringify({ ok: false, error: "DATABASE_URL is not set" }));
  process.exit(1);
}

function parse(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`No front matter in ${file}`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return { ...meta, content: m[2].trim() + "\n" };
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const dir = path.join(root, "content", "posts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
let day = files.length;
for (const f of files) {
  const p = parse(path.join(dir, f));
  const [rows] = await conn.query("SELECT id FROM posts WHERE slug = ?", [p.slug]);
  if (rows.length) {
    console.log(JSON.stringify({ ok: true, slug: p.slug, skipped: "exists" }));
    continue;
  }
  const publishedAt = new Date(Date.now() - day-- * 2 * 864e5);
  await conn.query(
    `INSERT INTO posts (slug, title, excerpt, content, meta_title, meta_description, focus_keyword, tags, author_name, status, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SEOKaroAI Team', 'published', ?, ?, ?)`,
    [p.slug, p.title, p.excerpt ?? "", p.content, p.metaTitle ?? null, p.metaDescription ?? null, p.focusKeyword ?? null, p.tags ?? null, publishedAt, publishedAt, publishedAt],
  );
  console.log(JSON.stringify({ ok: true, slug: p.slug, inserted: true }));
}
await conn.end();
