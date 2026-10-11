import type { Metadata } from "next";
import Link from "next/link";
import { PostMetaLine } from "@/components/PostMetaLine";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Writing by Sviatlana Buben on product engineering and AI that takes work off your plate.",
  alternates: { canonical: "/writing" },
};

const WRITING_INTRO =
  "[Placeholder] Short essays on product engineering and AI that takes work off your plate.";

// Static: the posts are modules in the repository (src/content/posts/), read
// through getPosts at build time; no request-time reads, no clock. Outside
// (dashboard), like / and /hire: no Providers, no Realtime, no pill.
export default async function WritingPage() {
  const posts = await getPosts();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
      <p className="mt-2 max-w-[70ch] text-base text-neutral-700 dark:text-neutral-300">
        {WRITING_INTRO}
      </p>
      {posts.length === 0 ? (
        <p className="mt-6 text-base text-neutral-500 dark:text-neutral-400">No posts yet.</p>
      ) : (
        <ul className="mt-6 max-w-[70ch] space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/writing/${post.slug}`}
                className="text-base font-semibold hover:underline hover:underline-offset-2"
              >
                {post.meta.title}
              </Link>
              <PostMetaLine meta={post.meta} />
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {post.meta.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
