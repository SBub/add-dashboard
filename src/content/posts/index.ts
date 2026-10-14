import type { MDXContent } from "mdx/types";

// Every post, listed by hand: slug plus a lazy import of its module. The
// import path is a string literal per entry (never a template), so the
// bundler, TypeScript and knip see each file. Add one line per post;
// registry.test.ts fails when a file in this directory and this list disagree.
// The LinkedIn companion text beside a post is never listed or imported.

export interface PostEntry {
  slug: string;
  load: () => Promise<{ default: MDXContent; meta?: unknown }>;
}

export const POST_ENTRIES: PostEntry[] = [
  { slug: "my-moat", load: () => import("./my-moat.mdx") },
  { slug: "feature-flags", load: () => import("./feature-flags.mdx") },
  { slug: "no-traffic", load: () => import("./no-traffic.mdx") },
];
