import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostMinimap } from "./PostMinimap";

describe("PostMinimap", () => {
  const html = renderToStaticMarkup(createElement(PostMinimap, { columnId: "post" }));
  const root = html.slice(0, html.indexOf(">") + 1);

  it("is hidden from assistive tech and inert", () => {
    expect(root).toContain('aria-hidden="true"');
    expect(root).toMatch(/\sinert(="")?[\s>]/);
  });

  it("is a narrow strip displayed only from xl", () => {
    expect(root).toMatch(/class="[^"]*\bhidden\b[^"]*"/);
    expect(root).toContain("xl:block");
    expect(root).toContain("w-[120px]");
  });

  it("ships no copy of the post: no text, image, link, heading or focus stop", () => {
    for (const needle of ["<a", "<img", "<h1", "<h2", "<h3", "<nav", "href=", "tabindex"]) {
      expect(html).not.toContain(needle);
    }
    expect(html.replace(/<[^>]*>/g, "")).toBe("");
  });

  it("renders an empty strip before the client measures (no shapes, no frame, no zoom)", () => {
    expect(html).not.toContain("data-minimap-shape");
    expect(html).not.toContain("data-minimap-frame");
    expect(html).not.toContain("zoom");
  });
});
