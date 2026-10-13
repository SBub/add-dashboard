import { describe, expect, it } from "vitest";
import { CLASS_BG, CLASS_FILL, MODEL_BG, PHASE_BG } from "./chart-colors";

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
