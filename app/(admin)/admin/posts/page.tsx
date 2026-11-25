import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Card, timeAgo } from "@/components/ui";

export const metadata = { title: "Blog posts" };

export default async function Posts() {
  const posts = await db().select().from(schema.posts).orderBy(desc(schema.posts.updatedAt)).limit(500);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">Blog posts</h1><Link href="/admin/posts/new" className="btn btn-primary w-full sm:w-auto">+ New post</Link></div>
      <Card>
        {posts.length === 0 ? <p className="muted text-sm">No posts yet.</p> : (
          <div className="table-wrap"><table className="w-full text-sm">
            <thead><tr className="muted border-b line text-left text-xs"><th className="py-2 pr-3">Title</th><th className="pr-3">Status</th><th className="pr-3">Focus keyword</th><th className="pr-3">Updated</th><th></th></tr></thead>
            <tbody>{posts.map((p) => (
              <tr key={p.id} className="border-b line last:border-0">
                <td className="wrap min-w-[14rem] py-2.5 pr-3"><Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-brand-500">{p.title}</Link><div className="muted break-all text-xs">/blog/{p.slug}</div></td>
                <td className="pr-3">{p.status === "published" ? (p.publishedAt && p.publishedAt > new Date() ? <span className="text-amber-600">scheduled</span> : <span className="text-emerald-600">published</span>) : <span className="muted">draft</span>}</td>
                <td className="pr-3 text-xs">{p.focusKeyword ?? "–"}</td><td className="muted pr-3 text-xs">{timeAgo(p.updatedAt)}</td>
                <td className="text-right">{p.status === "published" && <a href={`/blog/${p.slug}`} target="_blank" className="text-xs text-brand-500">View ↗</a>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
