import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { userProjects } from "@/lib/queries";
import { ADDONS, ensureAddonTables, hasAddon } from "@/lib/addons";
import { ActionForm, SubmitButton } from "@/components/client";
import { CopyAndOpenButton } from "@/components/outreach-client";
import { Icon } from "@/components/icons";
import { Card, Empty, PageHeader, timeAgo } from "@/components/ui";
import { deleteOutreachItem, findOutreachOpportunities, generateDraftAction, saveOutreachDraft, updateOutreachStatus } from "./actions";

export const metadata = { title: "Reddit & Quora Outreach" };

const STATUS_STYLE: Record<string, string> = {
  found: "bg-[var(--panel2)] muted ring-[var(--line)]",
  drafted: "bg-brand-500/12 text-brand-600 ring-brand-500/30",
  posted: "bg-low/12 text-low ring-low/30",
  skipped: "bg-[var(--panel2)] muted ring-[var(--line)] opacity-70",
};

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ project?: string; status?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const addon = ADDONS.community_outreach;
  const unlocked = await hasAddon(user, "community_outreach");

  if (!unlocked) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reddit & Quora Outreach" subtitle="Separate Paid Add-on · Find high-intent threads & draft value-first replies" />
        <section className="panel relative overflow-hidden p-6 sm:p-10">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative max-w-2xl space-y-5">
            <span className="chip text-brand-500"><Icon name="Sparkles" size={14} />Paid Add-on · ${addon.priceMonthly}/month (separate from plans)</span>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{addon.tagline}</h2>
            <ul className="space-y-2.5 text-[14.5px]">
              {addon.highlights.map((h) => (
                <li key={h} className="flex gap-2.5"><Icon name="Check" size={16} className="mt-0.5 shrink-0 text-low" /><span>{h}</span></li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/app/billing#addons" className="btn btn-brand justify-center">Unlock Add-on (${addon.priceMonthly}/mo) <Icon name="ArrowRight" size={15} /></Link>
              <Link href="/app" className="btn justify-center">Back to Dashboard</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  await ensureAddonTables();
  const projects = await userProjects(user.id);
  const projectFilter = sp.project && sp.project !== "all" ? Number(sp.project) || 0 : 0;
  const defaultFormProjectId = projectFilter || projects[0]?.id || 0;
  const statusFilter = ["found", "drafted", "posted", "skipped"].includes(sp.status ?? "") ? sp.status! : "all";

  const conditions = [eq(schema.outreachItems.userId, user.id)];
  if (projectFilter) conditions.push(eq(schema.outreachItems.projectId, projectFilter));
  if (statusFilter !== "all") conditions.push(eq(schema.outreachItems.status, statusFilter));

  const items = await db()
    .select()
    .from(schema.outreachItems)
    .where(and(...conditions))
    .orderBy(desc(schema.outreachItems.createdAt))
    .limit(60);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const buildHref = (nextProject: number | "all", nextStatus: string) => {
    const qs = new URLSearchParams();
    if (nextProject !== "all" && nextProject > 0) qs.set("project", String(nextProject));
    if (nextStatus !== "all") qs.set("status", nextStatus);
    const s = qs.toString();
    return s ? `/app/outreach?${s}` : "/app/outreach";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reddit & Quora Outreach"
        subtitle="Discover active threads, draft natural value-first answers with AI, and post safely from your own account."
      />

      {projects.length === 0 ? (
        <Card>
          <Empty
            title="Add a website first"
            text="Add your website so SEOKaroAI can find relevant Reddit threads and Quora questions for your niche."
            action={<Link href="/app/projects/new" className="btn btn-brand"><Icon name="Plus" size={15} />Add website</Link>}
          />
        </Card>
      ) : (
        <>
          {/* Discovery form — ActionForm wraps a nested grid so status banners span full width cleanly */}
          <Card title="Find new Reddit & Quora opportunities">
            <ActionForm action={findOutreachOpportunities} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select name="projectId" defaultValue={defaultFormProjectId} className="input">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.domain})</option>
                  ))}
                </select>
                <input name="topic" placeholder="Keyword or topic (optional — uses tracked keywords)" className="input lg:col-span-2" />
                <div className="flex gap-2">
                  <select name="platform" defaultValue="all" className="input !w-auto">
                    <option value="all">Both</option>
                    <option value="reddit">Reddit</option>
                    <option value="quora">Quora</option>
                  </select>
                  <SubmitButton className="btn btn-brand flex-1" pendingText="Searching…">
                    <Icon name="SearchCheck" size={15} />Find threads
                  </SubmitButton>
                </div>
              </div>
            </ActionForm>
          </Card>

          {/* Project + Status filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              {["all", "found", "drafted", "posted", "skipped"].map((st) => (
                <Link
                  key={st}
                  href={buildHref(projectFilter || "all", st)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${statusFilter === st ? "border-brand-500 bg-brand-500 text-white" : "line bg-[var(--panel)] muted hover:text-[var(--ink)]"}`}
                >
                  {st}
                </Link>
              ))}
            </div>
            {projects.length > 1 && (
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
                <Link
                  href={buildHref("all", statusFilter)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${projectFilter === 0 ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "line bg-[var(--panel)] muted hover:text-[var(--ink)]"}`}
                >
                  All websites
                </Link>
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={buildHref(p.id, statusFilter)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${projectFilter === p.id ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "line bg-[var(--panel)] muted hover:text-[var(--ink)]"}`}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Opportunity list */}
          {items.length === 0 ? (
            <Card>
              <Empty
                title="No discussions yet"
                text="Enter a keyword above and click Find threads to discover relevant Reddit posts and Quora questions."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const proj = projectMap.get(item.projectId);
                return (
                  <section key={item.id} className="panel space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-md px-2 py-0.5 font-semibold uppercase ${item.platform === "reddit" ? "bg-orange-500/12 text-orange-700" : "bg-rose-500/12 text-rose-700"}`}>
                            {item.platform}
                          </span>
                          {item.community && <span className="muted font-mono">{item.community}</span>}
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${STATUS_STYLE[item.status] ?? STATUS_STYLE.found}`}>
                            {item.status}
                          </span>
                          <span className="muted">{timeAgo(item.createdAt)}</span>
                          {proj && <span className="muted">· {proj.name}</span>}
                        </div>
                        <h3 className="mt-2 break-words text-[15.5px] font-semibold leading-snug">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500">
                            {item.title}
                          </a>
                        </h3>
                        {item.snippet && <p className="muted mt-1.5 line-clamp-3 break-words text-[13.5px]">{item.snippet}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ActionForm action={generateDraftAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <SubmitButton className="btn" pendingText="Drafting…">
                            <Icon name="WandSparkles" size={14} />{item.draftReply ? "Regenerate draft" : "Generate AI draft"}
                          </SubmitButton>
                        </ActionForm>
                        <CopyAndOpenButton text={item.draftReply ?? ""} url={item.url} />
                      </div>
                    </div>

                    {/* Editable AI draft */}
                    <ActionForm action={saveOutreachDraft} className="space-y-2.5">
                      <input type="hidden" name="itemId" value={item.id} />
                      <textarea
                        name="draftReply"
                        defaultValue={item.draftReply ?? ""}
                        rows={item.draftReply ? 5 : 2}
                        placeholder="Click “Generate AI draft” above to write a helpful, non-spammy reply — or type your own draft here."
                        className="input font-sans text-[13.5px] leading-relaxed"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <SubmitButton className="btn !py-1.5 text-xs" pendingText="Saving…">Save draft</SubmitButton>
                      </div>
                    </ActionForm>

                    {/* Status actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t line pt-3 text-xs">
                      <form action={updateOutreachStatus}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="status" value="posted" />
                        <button className="btn !py-1 text-xs text-low"><Icon name="Check" size={13} />Mark posted</button>
                      </form>
                      <form action={updateOutreachStatus}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="status" value="skipped" />
                        <button className="btn btn-ghost !py-1 text-xs">Skip</button>
                      </form>
                      <form action={deleteOutreachItem} className="ml-auto">
                        <input type="hidden" name="itemId" value={item.id} />
                        <button className="btn btn-ghost !py-1 text-xs !text-rose-600" title="Delete"><Icon name="Trash2" size={13} /></button>
                      </form>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
