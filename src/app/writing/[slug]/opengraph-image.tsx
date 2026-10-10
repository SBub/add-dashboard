import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";

// A post's 1200x630 Open Graph image: its title and the author's name.
// generateImageMetadata is the only way to give each image a per-post alt (a
// static `alt` export cannot), which puts the image at
// /writing/<slug>/opengraph-image/og. Default bundled font only: no fetch, no
// external fonts or images.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FALLBACK_ALT = "Sviatlana Buben, writing";

// Next calls this with a page's resolved params when it writes og:image, and
// at build time, from the image route's own generateStaticParams, with no slug
// at all (that route does not inherit the page's params). That call only
// collects ids, and under cacheComponents an empty list errors the build, so
// it gets the one id; Image below still answers 404 for a slug that is no post.
export async function generateImageMetadata({ params }: { params: { slug?: string } }) {
  if (params?.slug === undefined) {
    return [{ id: "og", alt: FALLBACK_ALT, size, contentType }];
  }
  const post = await getPost(params.slug);
  if (!post) return [];
  return [{ id: "og", alt: post.meta.title, size, contentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#ffffff",
        color: "#171717",
      }}
    >
      <div style={{ display: "flex", fontSize: 64, fontWeight: 600, lineHeight: 1.15 }}>
        {post.meta.title}
      </div>
      <div style={{ display: "flex", fontSize: 32, color: "#525252" }}>Sviatlana Buben</div>
    </div>,
    size,
  );
}
