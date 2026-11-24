import { eq } from "drizzle-orm";
import { db, parseJson, schema } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { Connector, User } from "@/lib/db/schema";
import { wordpress } from "./wordpress";
import { shopify } from "./shopify";
import { github } from "./github";
import { folder } from "./folder";
import type { CmsDriver, CodeDriver, ConnectorKind } from "./types";

export const CMS: Record<string, CmsDriver> = { wordpress, shopify };
export const CODE: Record<string, CodeDriver> = { github, folder };
export const isCms = (k: string) => k in CMS;

export function connectorCreds(c: Connector) {
  return { cfg: parseJson<Record<string, string>>(c.config, {}), secret: c.secret ? decrypt(c.secret) : "" };
}

export async function testConnector(c: Connector) {
  const { cfg, secret } = connectorCreds(c);
  const driver = CMS[c.kind] ?? CODE[c.kind];
  const r = c.kind === "local" ? { ok: true, message: "Folder access is granted in your browser each time." } : driver ? await driver.test(cfg, secret) : { ok: false, message: "Unknown connector" };
  await db().update(schema.connectors).set({ status: r.ok ? "ok" : "error", lastError: r.ok ? null : r.message, lastTestedAt: new Date() }).where(eq(schema.connectors.id, c.id));
  return r;
}

export async function ownedConnector(user: User, id: number): Promise<Connector | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [c] = await db().select().from(schema.connectors).where(eq(schema.connectors.id, id)).limit(1);
  if (!c || (c.userId !== user.id && user.role !== "admin")) return null;
  return c;
}

export async function projectConnectors(projectId: number) {
  return db().select().from(schema.connectors).where(eq(schema.connectors.projectId, projectId));
}

export type { ConnectorKind };
