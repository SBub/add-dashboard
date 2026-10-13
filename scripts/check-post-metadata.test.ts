// The post metadata check, run by `yarn check:og` after `yarn build`. For
// every non-draft post it reads the prerendered
// .next/server/app/writing/<slug>.html (exactly what production serves) and
// asserts the title, description, canonical, Open Graph and Twitter card tags
// against the post's own meta. Posts come from POST_ENTRIES through getPosts(),
// so a new post is covered with no edit here. Reads local files only: no
// network, no server.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { POST_ENTRIES } from "@/content/posts";
import { getPosts } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site-url";

const HTML_DIR = ".next/server/app/writing";

// vitest runs with NODE_ENV=test, so getPosts() keeps drafts: drop them here.
const posts = (await getPosts()).filter((post) => !post.meta.draft);

function readPostHtml(slug: string): string {
  const path = join(HTML_DIR, `${slug}.html`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- check only; slug comes from POST_ENTRIES, validated by getPosts()
  if (!existsSync(path)) {
    throw new Error(`Post "${slug}": ${path} is missing; run yarn build first`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- check only; slug comes from POST_ENTRIES, validated by getPosts()
  return readFileSync(path, "utf8");
}

// The entities React emits in attributes and text.
function decode(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function tagAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [, name, value] of tag.matchAll(/(\w[\w:-]*)="([^"]*)"/g)) {
    if (name !== undefined && value !== undefined) attributes[name] = decode(value);
  }
  return attributes;
}

function metaContent(html: string, attr: "property" | "name", key: string): string | undefined {
  for (const [tag] of html.matchAll(/<meta[^>]*>/g)) {
    const attributes = tagAttributes(tag);
    if (attributes[attr] === key) return attributes.content;
  }
  return undefined;
}

function linkHref(html: string, rel: string): string | undefined {
  for (const [tag] of html.matchAll(/<link[^>]*>/g)) {
    const attributes = tagAttributes(tag);
    if (attributes.rel === rel) return attributes.href;
  }
  return undefined;
}

// The last `length` characters, so a mismatch shows the URL's actual tail.
function tail(value: string | undefined, length: number): string | undefined {
  return value?.slice(-length);
}

function titleText(html: string): string | undefined {
  const match = /<title>([^<]*)<\/title>/.exec(html);
  return match?.[1] === undefined ? undefined : decode(match[1].trim());
}

describe("post metadata", () => {
  it("checks every non-draft post", async () => {
    const entries = await Promise.all(POST_ENTRIES.map((entry) => entry.load()));
    const nonDrafts = entries.filter((mod) => !(mod.meta as { draft?: boolean }).draft);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.length).toBe(nonDrafts.length);
    console.log(`check:og: ${posts.length} posts checked`);
  });

  for (const { slug, meta } of posts) {
    it(slug, () => {
      const html = readPostHtml(slug);
      const og = (key: string) => metaContent(html, "property", key);
      const path = `/writing/${slug}`;

      expect(titleText(html), `${slug}: <title>`).toBe(meta.title);
      expect(metaContent(html, "name", "description"), `${slug}: description`).toBe(
        meta.description,
      );
      expect(tail(linkHref(html, "canonical"), path.length), `${slug}: canonical`).toBe(path);
      expect(tail(og("og:url"), path.length), `${slug}: og:url`).toBe(path);
      expect(og("og:title"), `${slug}: og:title`).toBe(meta.title);
      expect(og("og:description"), `${slug}: og:description`).toBe(meta.description);
      expect(og("og:type"), `${slug}: og:type`).toBe("article");
      expect(og("og:site_name"), `${slug}: og:site_name`).toBe(SITE_NAME);
      expect(og("og:image"), `${slug}: og:image`).toContain(`${path}/opengraph-image/`);
      expect(og("og:image:width"), `${slug}: og:image:width`).toBe("1200");
      expect(og("og:image:height"), `${slug}: og:image:height`).toBe("630");
      expect(og("og:image:type"), `${slug}: og:image:type`).toBe("image/png");
      expect(og("og:image:alt")?.trim(), `${slug}: og:image:alt`).toBeTruthy();
      expect(metaContent(html, "name", "twitter:card"), `${slug}: twitter:card`).toBe(
        "summary_large_image",
      );
    });
  }
});
