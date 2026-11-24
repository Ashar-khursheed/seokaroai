import Link from "next/link";
import { PostEditor } from "@/components/post-editor";
import { savePost } from "../../actions";

export const metadata = { title: "New post" };

export default function NewPost() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><Link href="/admin/posts" className="muted text-sm">← Posts</Link><h1 className="text-2xl font-semibold tracking-[-0.02em]">New post</h1></div>
      <PostEditor action={savePost} />
    </div>
  );
}
