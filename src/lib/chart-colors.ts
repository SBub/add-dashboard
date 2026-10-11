// The one place an issue class, a model or a pipeline phase gets a chart
// colour. The class hues are IssueClassBadge's and carry meaning, so a class
// has one colour across the app. Model and phase bars are one neutral gray:
// the name under each column identifies it, so colour adds nothing. Full
// literal class strings, so Tailwind sees them. Neither classes, models nor
// phases are states: none of these is a status hue.
import type { ClassKey } from "./daily-summary";
import type { ModelFamily } from "./model-usage";
import type { PhaseKey } from "./phase-usage";

/** Class fills for the SVG class bar (ClassDistributionBar). */
export const CLASS_FILL: Record<ClassKey, string> = {
  "/feature": "fill-violet-500",
  "/bug": "fill-fuchsia-500",
  "/chore": "fill-neutral-400",
  "/patch": "fill-lime-500",
  other: "fill-neutral-300 dark:fill-neutral-600",
};

/** The same class hues as backgrounds, for CSS columns (ClassColumnChart). */
export const CLASS_BG: Record<ClassKey, string> = {
  "/feature": "bg-violet-500",
  "/bug": "bg-fuchsia-500",
  "/chore": "bg-neutral-400",
  "/patch": "bg-lime-500",
  other: "bg-neutral-300 dark:bg-neutral-600",
};

/** Model family backgrounds, one neutral gray, for CSS columns (ModelColumnChart). */
export const MODEL_BG: Record<ModelFamily, string> = {
  opus: "bg-neutral-400 dark:bg-neutral-500",
  sonnet: "bg-neutral-400 dark:bg-neutral-500",
  haiku: "bg-neutral-400 dark:bg-neutral-500",
  other: "bg-neutral-400 dark:bg-neutral-500",
};

/** Pipeline phase backgrounds, one neutral gray, for CSS columns (PhaseColumnChart). */
export const PHASE_BG: Record<PhaseKey, string> = {
  adw_plan_iso: "bg-neutral-400 dark:bg-neutral-500",
  adw_build_iso: "bg-neutral-400 dark:bg-neutral-500",
  adw_test_iso: "bg-neutral-400 dark:bg-neutral-500",
  adw_review_iso: "bg-neutral-400 dark:bg-neutral-500",
  adw_document_iso: "bg-neutral-400 dark:bg-neutral-500",
};

/** The value text inside a neutral bar; white fails AA on neutral-400. */
export const NEUTRAL_BAR_VALUE = "text-neutral-950 dark:text-white";
