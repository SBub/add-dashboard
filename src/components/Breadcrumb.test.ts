import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "./Breadcrumb";

function count(markup: string, needle: string) {
  return markup.split(needle).length - 1;
}

const title = "My moat as a Product Engineer";

describe("Breadcrumb", () => {
  const html = renderToStaticMarkup(createElement(Breadcrumb, { title }));

  it("is a navigation landmark named Breadcrumb", () => {
    expect(html).toMatch(/<nav[^>]*aria-label="Breadcrumb"/);
  });

  it("lists exactly two items", () => {
    expect(count(html, "<li")).toBe(2);
  });

  it("links Writing to /writing before the title", () => {
    expect(html).toMatch(/<a[^>]*href="\/writing"[^>]*>Writing<\/a>/);
    expect(html.indexOf('href="/writing"')).toBeLessThan(html.indexOf(title));
  });

  it("marks the title as the current page", () => {
    expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>${title}<`));
  });

  it("hides the separator from screen readers", () => {
    expect(html).toMatch(/<span aria-hidden="true">\/<\/span>/);
  });

  it("renders no heading", () => {
    expect(html).not.toContain("<h1");
  });
});
