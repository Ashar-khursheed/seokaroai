import fs from "node:fs";
import { notFound } from "next/navigation";
import { and, desc, eq, lt } from "drizzle-orm";
import { ownedRun } from "@/lib/access";
import { db, parseJson, schema } from "@/lib/db";
import { runFolder } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";
import { AutoRefresh } from "@/components/client";
import { AuditView, type PrevAudit } from "@/components/report/audit-view";
import { KeywordView } from "@/components/report/keyword-view";
import { QuickView } from "@/components/report/quick-view";
import { FixView } from "@/components/report/fix-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const found = await ownedRun(decodeURIComponent((await params).id));
  return { title: found?.run.title ?? "Report" };
}

export default async function RunPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; file?: string }> }) {
  const id = decodeURIComponent((await params).id);
  const found = await ownedRun(id);
  if (!found) notFound();
  const { view, file } = await searchParams;
  const dir = runFolder(id);
  fs.mkdirSync(dir, { recursive: true });
  const running = found.run.status === "running" || found.run.status === "queued";
  if (!running) await ensureRunFiles(id);
  let prevAudit: PrevAudit | null = null;
  if (found.run.kind === "deep" && found.run.projectId) {
    const [prev] = await db()
      .select({ id: schema.runs.id, score: schema.runs.score, summary: schema.runs.summary, finishedAt: schema.runs.finishedAt, createdAt: schema.runs.createdAt })
      .from(schema.runs)
      .where(and(eq(schema.runs.projectId, found.run.projectId), eq(schema.runs.kind, "deep"), eq(schema.runs.status, "done"), lt(schema.runs.createdAt, found.run.createdAt)))
      .orderBy(desc(schema.runs.createdAt))
      .limit(1);
    if (prev) {
      const s = parseJson<{ categories?: { label: string; score: number | null }[] }>(prev.summary, {});
      prevAudit = { id: prev.id, score: prev.score, at: prev.finishedAt ?? prev.createdAt, categories: s.categories ?? [] };
    }
  }
  const props = { run: found.run, dir, view, file };
  return (
    <>
      <AutoRefresh active={running} ms={20000} />
      {found.run.kind === "keyword" ? <KeywordView {...props} /> : found.run.kind === "deep" ? <AuditView {...props} prev={prevAudit} /> : found.run.kind === "fix" ? <FixView {...props} /> : <QuickView {...props} />}
    </>
  );
}
