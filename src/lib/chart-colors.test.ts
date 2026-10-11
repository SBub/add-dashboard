import { describe, expect, it } from "vitest";
import { CLASS_BG, CLASS_FILL, MODEL_BG, NEUTRAL_BAR_VALUE, PHASE_BG } from "./chart-colors";

// Tailwind v4 neutrals in sRGB, from the oklch values in
// node_modules/tailwindcss/theme.css.
const NEUTRAL_HEX: Record<string, string> = {
  "neutral-400": "#a1a1a1",
  "neutral-500": "#737373",
  "neutral-950": "#0a0a0a",
  white: "#ffffff",
};

/** WCAG relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The light and dark colour of a class string, as hex, by its `bg-`/`text-` prefix. */
function themeHex(classes: string, prefix: "bg" | "text"): { light: string; dark: string } {
  const tokens = classes.split(" ");
  const pick = (dark: boolean) => {
    const token = tokens.find((t) => t.startsWith("dark:") === dark);
    const name = token?.replace(/^dark:/, "").replace(`${prefix}-`, "");
    const hex = name ? NEUTRAL_HEX[name] : undefined;
    if (!hex) throw new Error(`no hex for ${token ?? "missing token"} in "${classes}"`);
    return hex;
  };
  return { light: pick(false), dark: pick(true) };
}

const NEUTRAL_MAPS = { MODEL_BG, PHASE_BG };

describe("MODEL_BG and PHASE_BG", () => {
  it("keep their keys", () => {
    expect(Object.keys(MODEL_BG)).toEqual(["opus", "sonnet", "haiku", "other"]);
    expect(Object.keys(PHASE_BG)).toEqual([
      "adw_plan_iso",
      "adw_build_iso",
      "adw_test_iso",
      "adw_review_iso",
      "adw_document_iso",
    ]);
  });

  it.each(Object.entries(NEUTRAL_MAPS))("%s holds neutral backgrounds only", (_, map) => {
    for (const value of Object.values(map)) {
      for (const token of value.split(" ")) {
        expect(token).toMatch(/^(?:dark:)?bg-neutral-\d{2,3}$/);
      }
    }
  });

  it.each(Object.entries(NEUTRAL_MAPS))(
    "%s in-bar value meets AA (4.5:1) in both themes",
    (_, map) => {
      const text = themeHex(NEUTRAL_BAR_VALUE, "text");
      for (const value of Object.values(map)) {
        const bar = themeHex(value, "bg");
        expect(contrast(bar.light, text.light)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(bar.dark, text.dark)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});

describe("class colours", () => {
  it("keep IssueClassBadge's hues", () => {
    expect(CLASS_BG).toEqual({
      "/feature": "bg-violet-500",
      "/bug": "bg-fuchsia-500",
      "/chore": "bg-neutral-400",
      "/patch": "bg-lime-500",
      other: "bg-neutral-300 dark:bg-neutral-600",
    });
    expect(CLASS_FILL).toEqual({
      "/feature": "fill-violet-500",
      "/bug": "fill-fuchsia-500",
      "/chore": "fill-neutral-400",
      "/patch": "fill-lime-500",
      other: "fill-neutral-300 dark:fill-neutral-600",
    });
  });
});
