import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RadioBar } from "./RadioBar";

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const html = renderToStaticMarkup(createElement(RadioBar));

describe("RadioBar", () => {
  it("credits NTS Slow Focus with a link to the mixtape page in a new tab", () => {
    expect(html).toContain("LIVE NOW");
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

  it("is a plain region, never a header, not sticky and without a z-index", () => {
    expect(html).not.toContain("<header");
    const root = html.match(/^<div[^>]*>/)?.[0] ?? "";
    expect(root).toContain('role="region"');
    expect(root).not.toMatch(/\bsticky\b/);
    expect(root).not.toMatch(/\bz-/);
  });
});
