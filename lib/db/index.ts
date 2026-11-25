import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const g = globalThis as unknown as { __skPool?: mysql.Pool; __skDb?: MySql2Database<typeof schema> };

function pool(): mysql.Pool {
  if (!g.__skPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local.");
    g.__skPool = mysql.createPool({
      uri: url,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
      maxIdle: 2,
      idleTimeout: 20_000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      connectTimeout: 10_000,
      waitForConnections: true,
      queueLimit: 0,
      timezone: "Z",
      dateStrings: false,
      charset: "utf8mb4",
    });
  }
  return g.__skPool;
}

/** Shared Drizzle client (one pool per server process, kept across dev reloads). */
export function db(): MySql2Database<typeof schema> {
  if (!g.__skDb) g.__skDb = drizzle(pool(), { schema, mode: "default" });
  return g.__skDb;
}

export function rawPool(): mysql.Pool {
  return pool();
}

export function parseJson<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export { schema };
