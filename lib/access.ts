import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import type { Run, User } from "@/lib/db/schema";

/** The run if the signed-in user owns it (or is an admin), else null. */
export async function ownedRun(id: string): Promise<{ run: Run; user: User } | null> {
  const user = await currentUser();
  if (!user) return null;
  const [run] = await db().select().from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
  if (!run || (run.userId !== user.id && user.role !== "admin")) return null;
  return { run, user };
}
