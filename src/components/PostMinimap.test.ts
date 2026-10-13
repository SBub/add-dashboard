import type { MDXComponents } from "mdx/types";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PostMeta } from "@/lib/posts";
import { PostMinimap } from "./PostMinimap";

const meta: PostMeta = {
  title: "Feature flags",
  description: "A post.",
  date: "2026-10-01",
  audience: "both",
  draft: false,
};

// Stands in for an MDX module: renders a link, a heading and an image through
// the components it is handed, the way compiled MDX does.
function Content({ components = {} }: { components?: MDXComponents }) {
  const A = components.a ?? "a";
  const H2 = components.h2 ?? "h2";
  const Img = components.img ?? "img";
  return createElement(
    "div",
    null,
    createElement(H2, null, "A section"),
    createElement(A, { href: "/projects" }, "Watch me build live"),
    createElement(Img, { src: "/writing/x.png", alt: "A screenshot" }),
  );
}

describe("PostMinimap", () => {
  const html = renderToStaticMarkup(
    createElement(PostMinimap, { meta, Content, columnId: "post" }),
  );
  const root = html.slice(0, html.indexOf(">") + 1);

  it("is hidden from assistive tech and inert", () => {
    expect(root).toContain('aria-hidden="true"');
    expect(root).toMatch(/\sinert(="")?[\s>]/);
  });

  it("is displayed only from xl", () => {
    expect(root).toMatch(/class="[^"]*\bhidden\b[^"]*"/);
    expect(root).toContain("xl:block");
  });

  it("renders no link, heading, nav or focus stop", () => {
    for (const needle of ["<a", "<h1", "<h2", "<h3", "<nav", "href=", "tabindex"]) {
      expect(html).not.toContain(needle);
    }
  });

  it("keeps the post's text", () => {
    expect(html).toContain("Feature flags");
    expect(html).toContain("A section");
    expect(html).toContain("Watch me build live");
  });

  it("keeps the image's src, without alt text, loading lazily", () => {
    expect(html).toMatch(/<img[^>]*src="\/writing\/x.png"/);
    expect(html).toMatch(/<img[^>]*alt=""/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).not.toContain("A screenshot");
  });

  it("renders no frame before hydration", () => {
    expect(html).not.toContain("translateY");
    expect(html).not.toContain("absolute");
  });
});
