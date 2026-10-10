// The writing blog's posts: validation, order, draft filter, labels and the
// Work with me link, plus the two loaders the /writing routes read posts
// through. The functions above the loaders are pure (no clock, no fs, no
// request-time reads), so they are testable with plain values; a post's date
// is a string from its meta, never compared with the clock.

import type { MDXContent } from "mdx/types";
import { POST_ENTRIES, type PostEntry } from "@/content/posts";
import { hireOfferHref } from "@/lib/hire-request";

export const POST_AUDIENCES = ["product-engineer", "small-business", "both"] as const;
export type PostAudience = (typeof POST_AUDIENCES)[number];

export interface PostMeta {
  title: string;
  description: string;
  date: string;
  audience: PostAudience;
  draft: boolean;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  Content: MDXContent;
}

/** Lowercase letters, digits and inner hyphens: "hello", "ai-at-work-2". */
export function isPostSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && !slug.startsWith("-") && !slug.endsWith("-");
}

function isAudience(value: unknown): value is PostAudience {
  return typeof value === "string" && (POST_AUDIENCES as readonly string[]).includes(value);
}

// A real calendar date: "2026-02-30" parses (it rolls over) but does not
// round-trip. Date.parse reads the given string, not the clock.
function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * A post's `meta` export, checked field by field. Throws an Error naming the
 * post and the field, so a bad post fails `yarn build`.
 */
export function parsePostMeta(slug: string, raw: unknown): PostMeta {
  const fail = (field: string, rule: string): never => {
    throw new Error(`Post "${slug}": ${field} ${rule}`);
  };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("meta", "must be an object (export const meta = {...})");
  }
  const { title, description, date, audience, draft } = raw as Record<string, unknown>;
  if (!isNonEmptyString(title)) return fail("title", "must be a non-empty string");
  if (!isNonEmptyString(description)) return fail("description", "must be a non-empty string");
  if (!isCalendarDate(date)) return fail("date", "must be a real date as YYYY-MM-DD");
  if (!isAudience(audience)) return fail("audience", `must be one of ${POST_AUDIENCES.join(", ")}`);
  if (typeof draft !== "boolean") return fail("draft", "must be true or false");
  return { title, description, date, audience, draft };
}

/** A copy, newest date first; equal dates by slug, so the order is stable. */
export function sortPostsNewestFirst<T extends { slug: string; meta: { date: string } }>(
  posts: T[],
): T[] {
  return [...posts].sort((a, b) => {
    if (a.meta.date !== b.meta.date) return a.meta.date < b.meta.date ? 1 : -1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
}

/** Drafts are shown in development and dropped in production. */
export function visiblePosts<T extends { meta: { draft: boolean } }>(
  posts: T[],
  nodeEnv: string | undefined,
): T[] {
  return nodeEnv === "production" ? posts.filter((post) => !post.meta.draft) : posts;
}

const AUDIENCE_LABELS: Record<PostAudience, string> = {
  "product-engineer": "For product teams",
  "small-business": "For business owners",
  both: "For everyone",
};

export function postAudienceLabel(audience: PostAudience): string {
  return AUDIENCE_LABELS[audience];
}

/** The Work with me link at a post's end, preselecting the matching offer. */
export function postHireHref(audience: PostAudience): string {
  if (audience === "product-engineer") return hireOfferHref("Product engineer");
  if (audience === "small-business") return hireOfferHref("AI consulting");
  return "/hire";
}

async function loadPost(entry: PostEntry): Promise<Post> {
  const mod = await entry.load();
  return { slug: entry.slug, meta: parsePostMeta(entry.slug, mod.meta), Content: mod.default };
}

/** Every visible post, newest first. NODE_ENV is inlined by Next. */
export async function getPosts(): Promise<Post[]> {
  const loaded = await Promise.all(POST_ENTRIES.map(loadPost));
  return sortPostsNewestFirst(visiblePosts(loaded, process.env.NODE_ENV));
}

/**
 * One visible post, or null. A malformed or unknown slug is rejected against
 * the registry before any module is imported; a draft in production is null
 * once its meta is read.
 */
export async function getPost(slug: string): Promise<Post | null> {
  if (!isPostSlug(slug)) return null;
  const entry = POST_ENTRIES.find((candidate) => candidate.slug === slug);
  if (!entry) return null;
  const post = await loadPost(entry);
  return visiblePosts([post], process.env.NODE_ENV).length > 0 ? post : null;
}
