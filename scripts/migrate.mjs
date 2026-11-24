#!/usr/bin/env node
/**
 * Apply SQL migrations in ./migrations in name order, once each.
 * Usage: node scripts/migrate.mjs            (reads DATABASE_URL from .env.local / env)
 *        node scripts/migrate.mjs --create   (also creates the database if it is missing)
 * Output: one JSON line per step.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnv } from "./env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const url = process.env.DATABASE_URL;
if (!url) {
  console.log(JSON.stringify({ ok: false, error: "DATABASE_URL is not set (.env.local)" }));
  process.exit(1);
}

const parsed = new URL(url);
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
if (process.argv.includes("--create")) {
  const serverUrl = new URL(url);
  serverUrl.pathname = "/";
  const c = await mysql.createConnection(serverUrl.toString());
  await c.query(`CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await c.end();
  console.log(JSON.stringify({ ok: true, step: "database", name: dbName }));
}

const conn = await mysql.createConnection({ uri: url, multipleStatements: true });
await conn.query(`CREATE TABLE IF NOT EXISTS _migrations (name VARCHAR(190) PRIMARY KEY, applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
const [rows] = await conn.query("SELECT name FROM _migrations");
const done = new Set(rows.map((r) => r.name));
const dir = path.join(root, "migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
let applied = 0;
for (const f of files) {
  if (done.has(f)) continue;
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    await conn.query(sql);
    await conn.query("INSERT INTO _migrations (name) VALUES (?)", [f]);
    applied++;
    console.log(JSON.stringify({ ok: true, step: "migration", name: f }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, step: "migration", name: f, error: String(e.message || e) }));
    await conn.end();
    process.exit(1);
  }
}
await conn.end();
console.log(JSON.stringify({ ok: true, applied, total: files.length }));
