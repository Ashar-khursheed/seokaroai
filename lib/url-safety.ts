import dns from "node:dns/promises";
import net from "node:net";

/**
 * Validate a customer-supplied website URL before we store it or audit it. Only public http(s)
 * hosts are accepted: no IP literals in private ranges, no localhost, no internal names. The
 * Python tools re-check every request (and pin DNS) through url_safety.py; this is the early gate.
 */

function privateV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}

function privateV6(ip: string): boolean {
  const s = ip.toLowerCase();
  if (s.startsWith("::ffff:")) return privateV4(s.slice(7));
  return s === "::" || s === "::1" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe8") || s.startsWith("fe9") || s.startsWith("fea") || s.startsWith("feb") || s.startsWith("ff");
}

export function normalizeUrl(input: unknown): string | null {
  let s = String(input ?? "").trim();
  if (!s || s.length > 500) return null;
  s = s.replace(/^(https?):\/*(?!\/)/i, "$1://"); // tolerate "https:www.example.com"
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (!u.hostname.includes(".") || u.hostname.endsWith(".local") || u.hostname.endsWith(".internal") || u.hostname === "localhost") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** Resolves the host and returns an error message, or null when the URL is public. */
export async function publicUrlProblem(url: string): Promise<string | null> {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "That is not a valid URL.";
  }
  const check = (ip: string) => (net.isIPv4(ip) ? privateV4(ip) : privateV6(ip));
  if (net.isIP(host)) return check(host) ? "Private or local addresses cannot be audited." : null;
  try {
    const addrs = await dns.lookup(host, { all: true });
    if (!addrs.length) return "That domain does not resolve.";
    if (addrs.some((a) => check(a.address))) return "That domain points to a private or local address.";
    return null;
  } catch {
    return "That domain does not resolve. Check the spelling.";
  }
}

export const domainOf = (url: string) => new URL(url).hostname.toLowerCase().replace(/^www\./, "");
