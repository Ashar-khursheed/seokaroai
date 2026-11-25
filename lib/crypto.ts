import crypto from "node:crypto";

/**
 * AES-256-GCM for connector secrets at rest. The key comes from ENCRYPTION_KEY (falls back to
 * SESSION_SECRET). Changing the key makes stored secrets unreadable, so connectors must be re-saved.
 */
function deriveKey(raw: string): Buffer {
  return crypto.createHash("sha256").update(`seokaroai:${raw}`).digest();
}

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw) throw new Error("ENCRYPTION_KEY (or SESSION_SECRET) must be set to store connector credentials.");
  return deriveKey(raw);
}

function candidateKeys(): Buffer[] {
  const raws = [process.env.ENCRYPTION_KEY, process.env.SESSION_SECRET].filter((v): v is string => Boolean(v));
  const unique = Array.from(new Set(raws));
  if (!unique.length) throw new Error("ENCRYPTION_KEY (or SESSION_SECRET) must be set to read connector credentials.");
  return unique.map(deriveKey);
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
  if (v !== "v1" || !iv || !tag || data == null) throw new Error("Unknown secret format");
  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  const dataBuf = Buffer.from(data, "base64");
  for (const k of candidateKeys()) {
    try {
      const d = crypto.createDecipheriv("aes-256-gcm", k, ivBuf);
      d.setAuthTag(tagBuf);
      return Buffer.concat([d.update(dataBuf), d.final()]).toString("utf8");
    } catch {
      // try next candidate key (e.g. ENCRYPTION_KEY added after secrets were encrypted with SESSION_SECRET)
    }
  }
  throw new Error(
    "Stored connector token could not be decrypted because ENCRYPTION_KEY / SESSION_SECRET changed on the server. Re-save this connector in your project's Connect & fix tab, then try again.",
  );
}

export const mask = (s: string) => (s.length <= 8 ? "••••" : `${s.slice(0, 4)}••••${s.slice(-4)}`);
