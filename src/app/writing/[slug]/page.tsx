import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostMetaLine } from "@/components/PostMetaLine";
import { getPost, getPosts } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site-url";

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

// The Open Graph image comes from opengraph-image.tsx beside this file. The
// canonical link and og:url are relative, resolved by the root layout's
// metadataBase. openGraph replaces the layout's openGraph whole (metadata
// merges shallowly), so siteName is repeated here.
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const { title, description, date } = post.meta;
  const path = `/writing/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: date,
      authors: ["Sviatlana Buben"],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const { meta, Content } = post;
  return (
    <article className="mx-auto max-w-6xl px-4 py-6">
      <div className="max-w-[62ch]">
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <PostMetaLine meta={meta} />
        <Content />
      </div>
    </article>
  );
}
