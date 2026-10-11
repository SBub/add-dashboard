import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPostSlug } from "@/lib/posts";
import { POST_ENTRIES } from "./index";

// The registry and the directory must agree: a post file without its line is
// never routed, a line without its file fails the build. load() is never
// called, so vitest never compiles MDX.

const registered = POST_ENTRIES.map((entry) => entry.slug);

describe("post registry", () => {
  it("lists every .mdx file in the directory, and nothing else", () => {
    const files = readdirSync("src/content/posts")
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => name.slice(0, -".mdx".length))
      .sort();
    expect([...registered].sort()).toEqual(files);
  });

  it("holds valid, unique slugs and no LinkedIn companion", () => {
    for (const slug of registered) {
      expect(isPostSlug(slug)).toBe(true);
      expect(slug.endsWith(".linkedin")).toBe(false);
    }
    expect(new Set(registered).size).toBe(registered.length);
  });
});
