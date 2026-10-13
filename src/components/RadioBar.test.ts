import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FOOTER_LAYER } from "@/lib/layers";
import { RadioBar } from "./RadioBar";

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const html = renderToStaticMarkup(createElement(RadioBar));
const root = html.match(/^<div[^>]*>/)?.[0] ?? "";
const text = html.replace(/<[^>]*>/g, "");

describe("RadioBar", () => {
  it("credits NTS Slow Focus with a link to the mixtape page in a new tab", () => {
    expect(html).toContain("NTS · SLOW FOCUS");
    expect(html).toMatch(
      /<a href="https:\/\/www\.nts\.live\/infinite-mixtapes\/slow-focus" target="_blank" rel="noopener noreferrer"/,
    );
  });

  it("renders idle, offering play", () => {
    expect(html).toContain('aria-label="Play NTS Slow Focus"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain("reach NTS");
  });

  it("renders a silent audio element with no source and no autoplay", () => {
    const audio = html.match(/<audio[^>]*>/)?.[0];
    expect(audio).toContain('preload="none"');
    expect(audio).not.toMatch(/\ssrc=/);
    expect(audio).not.toMatch(/autoplay/i);
  });

  it("is a region fixed to the bottom on the footer layer, never a header or footer landmark", () => {
    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(root).toContain('role="region"');
    const classes = root.match(/class="([^"]*)"/)?.[1]?.split(" ") ?? [];
    expect(classes).toEqual(
      expect.arrayContaining([
        "fixed",
        "bottom-0",
        "inset-x-0",
        "border-t",
        "bg-background",
        FOOTER_LAYER,
      ]),
    );
    expect(root).not.toMatch(/\bborder-b\b/);
    expect(root).not.toMatch(/\bsticky\b/);
  });

  it("shows no live label and no red", () => {
    expect(text).not.toMatch(/live/i);
    expect(html).not.toMatch(/\bbg-red-\d+/);
    expect(html).not.toMatch(/\bred-\d{2,3}\b/);
  });

  it("rounds the box around the button", () => {
    expect(html).toMatch(
      /<div class="[^"]*\brounded-md\b[^"]*"><span aria-hidden="true">∞<\/span>/,
    );
  });
});
