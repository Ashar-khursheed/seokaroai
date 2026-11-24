#!/usr/bin/env node
/**
 * Create or reset the super admin account (role admin, email confirmed, Agency plan).
 * A random password is generated and written to data/ADMIN-ACCOUNT.md (gitignored), never printed.
 * Usage: node scripts/create-admin.mjs [--email admin@seokaroai.com]
 * Output: one JSON line.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { loadEnv } from "./env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);
const i = process.argv.indexOf("--email");
const email = (i > 0 ? process.argv[i + 1] : "admin@seokaroai.com").toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.log(JSON.stringify({ ok: false, error: "invalid email" }));
  process.exit(1);
}

const scrypt = promisify(crypto.scrypt);
const password = `Sk-${crypto.randomBytes(12).toString("base64url")}9`;
const salt = crypto.randomBytes(16);
const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const hash = `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
if (rows.length) {
  await conn.query("UPDATE users SET password_hash = ?, role = 'admin', email_verified_at = COALESCE(email_verified_at, NOW(3)), plan = 'agency', plan_status = 'active', suspended_at = NULL WHERE id = ?", [hash, rows[0].id]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [rows[0].id]);
} else {
  await conn.query("INSERT INTO users (email, name, password_hash, role, email_verified_at, plan, plan_status) VALUES (?, 'Super Admin', ?, 'admin', NOW(3), 'agency', 'active')", [email, hash]);
}
await conn.end();

const out = path.join(root, "data", "ADMIN-ACCOUNT.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `# SEOKaroAI super admin\n\nLogin: ${process.env.APP_URL || "http://localhost:3100"}/login\n\nemail: ${email}\npassword: ${password}\n\nChange the password after the first login (Settings → Change password).\nRe-run \`npm run create-admin\` to reset it.\n`);
console.log(JSON.stringify({ ok: true, email, created: !rows.length, credentialsFile: out }));
