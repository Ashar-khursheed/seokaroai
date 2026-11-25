import fs from "node:fs";
import { notFound } from "next/navigation";
import { ownedRun } from "@/lib/access";
import { runFolder } from "@/lib/files";
import { ensureRunFiles } from "@/lib/run-files";
import { AutoRefresh } from "@/components/client";
import { AuditView } from "@/components/report/audit-view";
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
  const props = { run: found.run, dir, view, file };
  return (
    <>
      <AutoRefresh active={running} ms={20000} />
      {found.run.kind === "keyword" ? <KeywordView {...props} /> : found.run.kind === "deep" ? <AuditView {...props} /> : found.run.kind === "fix" ? <FixView {...props} /> : <QuickView {...props} />}
    </>
  );
}
