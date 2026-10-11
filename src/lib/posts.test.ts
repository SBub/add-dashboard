import { describe, expect, it } from "vitest";
import {
  isPostSlug,
  parsePostMeta,
  postAudienceLabel,
  sortPostsNewestFirst,
  visiblePosts,
} from "./posts";

const VALID = {
  title: "A title",
  description: "A description",
  date: "2026-10-10",
  audience: "both",
  draft: false,
};

describe("parsePostMeta", () => {
  it("parses a valid meta to exactly the five fields", () => {
    expect(parsePostMeta("my-moat", { ...VALID, extra: 1 })).toEqual(VALID);
  });

  const bad: [string, unknown][] = [
    ["title", { ...VALID, title: undefined }],
    ["description", { ...VALID, description: "" }],
    ["date", { ...VALID, date: undefined }],
    ["date", { ...VALID, date: "2026-1-2" }],
    ["date", { ...VALID, date: "2026-02-30" }],
    ["date", { ...VALID, date: "12.10.2026" }],
    ["audience", { ...VALID, audience: "everyone" }],
    ["draft", { ...VALID, draft: "false" }],
    ["draft", { ...VALID, draft: undefined }],
    ["meta", undefined],
    ["meta", "a string"],
  ];

  it.each(bad)("throws naming the post and the field %s", (field, raw) => {
    expect(() => parsePostMeta("my-moat", raw)).toThrow(/"my-moat"/);
    expect(() => parsePostMeta("my-moat", raw)).toThrow(field);
  });
});

describe("isPostSlug", () => {
  it("accepts lowercase slugs with inner hyphens", () => {
    expect(isPostSlug("my-moat")).toBe(true);
    expect(isPostSlug("ai-at-work-2")).toBe(true);
  });

  it("rejects everything else", () => {
    for (const slug of ["Hello", "a_b", "-a", "a-", "a.linkedin", "_", "", "../x"]) {
      expect(isPostSlug(slug)).toBe(false);
    }
  });
});

describe("sortPostsNewestFirst", () => {
  it("orders by date descending, then by slug, without mutating the input", () => {
    const posts = [
      { slug: "b", meta: { date: "2026-01-01" } },
      { slug: "c", meta: { date: "2026-03-01" } },
      { slug: "z", meta: { date: "2026-02-01" } },
      { slug: "a", meta: { date: "2026-02-01" } },
    ];
    const copy = [...posts];
    expect(sortPostsNewestFirst(posts).map((post) => post.slug)).toEqual(["c", "a", "z", "b"]);
    expect(posts).toEqual(copy);
  });
});

describe("visiblePosts", () => {
  const posts = [
    { slug: "draft", meta: { draft: true } },
    { slug: "live", meta: { draft: false } },
  ];

  it("keeps drafts outside production", () => {
    expect(visiblePosts(posts, "development")).toHaveLength(2);
    expect(visiblePosts(posts, "test")).toHaveLength(2);
    expect(visiblePosts(posts, undefined)).toHaveLength(2);
  });

  it("drops drafts in production", () => {
    expect(visiblePosts(posts, "production").map((post) => post.slug)).toEqual(["live"]);
  });
});

describe("postAudienceLabel", () => {
  it("labels each audience", () => {
    expect(postAudienceLabel("product-engineer")).toBe("For product teams");
    expect(postAudienceLabel("small-business")).toBe("For business owners");
    expect(postAudienceLabel("both")).toBe("For everyone");
  });
});
