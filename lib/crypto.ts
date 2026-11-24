import crypto from "node:crypto";

/**
 * AES-256-GCM for connector secrets at rest. The key comes from ENCRYPTION_KEY (falls back to
 * SESSION_SECRET). Changing the key makes stored secrets unreadable, so connectors must be re-saved.
 */
function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw) throw new Error("ENCRYPTION_KEY (or SESSION_SECRET) must be set to store connector credentials.");
  return crypto.createHash("sha256").update(`seokaroai:${raw}`).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

export function decrypt(blob: string | null | undefined): string {
  if (!blob) return "";
  const [v, iv, tag, data] = blob.split(":");
  if (v !== "v1") throw new Error("Unknown secret format");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

export const mask = (s: string) => (s.length <= 8 ? "••••" : `${s.slice(0, 4)}••••${s.slice(-4)}`);
