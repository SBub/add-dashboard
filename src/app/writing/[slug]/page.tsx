import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostMetaLine } from "@/components/PostMetaLine";
import { HIRE_ACCENT } from "@/lib/accent";
import { getPost, getPosts, postHireHref } from "@/lib/posts";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// One static page per visible post. A slug outside this list is resolved on
// request and, being no post, hits notFound(). (dynamicParams cannot be
// exported under cacheComponents.)
export async function generateStaticParams() {
  const posts = await getPosts();
  // Under cacheComponents an empty array errors the build, so a production
  // build with only drafts hands it one placeholder. "_" fails isPostSlug, so
  // getPost returns null and the page falls through to notFound().
  if (posts.length === 0) return [{ slug: "_" }];
  return posts.map((post) => ({ slug: post.slug }));
}

// The Open Graph image comes from opengraph-image.tsx beside this file.
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const { title, description, date } = post.meta;
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: date,
      authors: ["Sviatlana Buben"],
    },
  };
}

const HIRE_LINK = `inline-block rounded-md px-3 py-1.5 text-sm font-medium ${HIRE_ACCENT}`;

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const { meta, Content } = post;
  return (
    <article className="mx-auto max-w-6xl px-4 py-6">
      <div className="max-w-[70ch]">
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <PostMetaLine meta={meta} />
        <Content />
        <section className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <p className="text-base text-neutral-700 dark:text-neutral-300">
            Want this kind of work done for you?
          </p>
          <Link href={postHireHref(meta.audience)} className={`mt-3 ${HIRE_LINK}`}>
            Work with me
          </Link>
        </section>
      </div>
    </article>
  );
}
