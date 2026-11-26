import { and, eq } from "drizzle-orm";
import { db, rawPool, schema } from "@/lib/db";
import type { User } from "@/lib/db/schema";

export type AddonCode = "community_outreach";

export interface AddonDef {
  code: AddonCode;
  name: string;
  priceMonthly: number;
  priceKey: string;
  tagline: string;
  highlights: string[];
}

export const ADDONS: Record<AddonCode, AddonDef> = {
  community_outreach: {
    code: "community_outreach",
    name: "Reddit & Quora Outreach",
    priceMonthly: 29,
    priceKey: "addon_community_outreach_monthly",
    tagline: "Find high-intent Reddit threads and Quora questions, draft natural value-first replies, and track brand mentions.",
    highlights: [
      "Discover relevant Reddit threads & Quora questions for your keywords",
      "AI-written value-first reply drafts with natural brand mentions",
      "Human-in-the-loop workflow (review, copy & post safely — zero bot bans)",
      "Outreach status tracker (Found → Drafted → Posted → Skipped)",
      "Sold separately — works on Free, Starter, Pro or Agency plans",
    ],
  },
};

export const ADDON_LIST: AddonDef[] = Object.values(ADDONS);

let tablesReady: Promise<void> | null = null;

/** Auto-create add-on tables on first use so deployments work even before running db:migrate. */
export function ensureAddonTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      const p = rawPool();
      await p.query(`
        CREATE TABLE IF NOT EXISTS user_addons (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          addon_code VARCHAR(40) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          paddle_subscription_id VARCHAR(64) NULL,
          renews_at DATETIME(3) NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          UNIQUE KEY uq_user_addon (user_id, addon_code),
          CONSTRAINT fk_user_addons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await p.query(`
        CREATE TABLE IF NOT EXISTS outreach_items (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          project_id BIGINT UNSIGNED NOT NULL,
          platform VARCHAR(16) NOT NULL,
          title VARCHAR(300) NOT NULL,
          url VARCHAR(700) NOT NULL,
          community VARCHAR(140) NOT NULL DEFAULT '',
          snippet TEXT NULL,
          draft_reply MEDIUMTEXT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'found',
          posted_url VARCHAR(700) NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          KEY ix_outreach_project (project_id, status),
          KEY ix_outreach_user (user_id, created_at),
          CONSTRAINT fk_outreach_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_outreach_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    })().catch((e) => {
      tablesReady = null;
      throw e;
    });
  }
  return tablesReady;
}

export async function getUserAddons(userId: number) {
  await ensureAddonTables();
  return db().select().from(schema.userAddons).where(eq(schema.userAddons.userId, userId));
}

export async function hasAddon(user: Pick<User, "id" | "role">, code: AddonCode): Promise<boolean> {
  if (user.role === "admin") return true;
  await ensureAddonTables();
  const [row] = await db()
    .select()
    .from(schema.userAddons)
    .where(and(eq(schema.userAddons.userId, user.id), eq(schema.userAddons.addonCode, code)))
    .limit(1);
  if (!row) return false;
  if (["active", "trialing"].includes(row.status)) return true;
  if (row.status === "canceled" && row.renewsAt && row.renewsAt > new Date()) return true;
  return false;
}

export async function setUserAddon(o: {
  userId: number;
  code: AddonCode;
  status: string;
  paddleSubscriptionId?: string | null;
  renewsAt?: Date | null;
}) {
  await ensureAddonTables();
  const now = new Date();
  await rawPool().query(
    `INSERT INTO user_addons (user_id, addon_code, status, paddle_subscription_id, renews_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       paddle_subscription_id = COALESCE(VALUES(paddle_subscription_id), paddle_subscription_id),
       renews_at = VALUES(renews_at),
       updated_at = VALUES(updated_at)`,
    [o.userId, o.code, o.status, o.paddleSubscriptionId ?? null, o.renewsAt ?? null, now, now],
  );
}
