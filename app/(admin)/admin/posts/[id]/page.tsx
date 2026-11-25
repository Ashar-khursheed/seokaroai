import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PostEditor } from "@/components/post-editor";
import { ConfirmButton } from "@/components/client";
import { deletePost, savePost } from "../../actions";

export const metadata = { title: "Edit post" };

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  const [post] = Number.isInteger(id) ? await db().select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1) : [];
  if (!post) notFound();
  const { saved } = await searchParams;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/posts" className="muted text-sm">← Posts</Link>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em]">Edit post</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {post.status === "published" && <a href={`/blog/${post.slug}`} target="_blank" className="btn !py-1 text-sm">View live ↗</a>}
          <form action={deletePost}><input type="hidden" name="id" value={post.id} /><ConfirmButton className="btn !py-1 text-sm !text-rose-600" message="Delete this post permanently?">Delete</ConfirmButton></form>
        </div>
      </div>
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Saved.</div>}
      <PostEditor post={post} action={savePost} />
    </div>
  );
}
