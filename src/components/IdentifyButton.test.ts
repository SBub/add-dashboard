import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IdentifyButton } from "./IdentifyButton";

vi.mock("posthog-js", () => ({
  default: {
    isFeatureEnabled: () => true,
    onFeatureFlags: () => vi.fn(),
    get_distinct_id: () => "0192a1b2-anonymous",
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

describe("IdentifyButton", () => {
  it("renders nothing on the server, even with the flag on", () => {
    expect(renderToStaticMarkup(createElement(IdentifyButton))).toBe("");
  });
});
