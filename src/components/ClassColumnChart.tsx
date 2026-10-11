import { CLASS_BG } from "@/lib/chart-colors";
import { classColumns, classLabel, shareLabel } from "@/lib/daily-summary";
import type { DailySummary } from "@/types/adw";
import { ColumnChart } from "./ColumnChart";

interface ClassColumnChartProps {
  counts: Pick<DailySummary, "runs" | "features" | "bugs" | "chores" | "patches">;
  /** The card's day (`YYYY-MM-DD`), for the chart's ids. */
  day: string;
}

/**
 * A day's runs by issue class: /feature, /chore and /bug always, /patch and
 * other when present, in classColumns' fixed order; a zero column is a
 * hairline with 0 above it. Hover or focus shows the count and the share of
 * the day's runs. Nothing when there are no runs.
 */
export function ClassColumnChart({ counts, day }: ClassColumnChartProps) {
  const columns = classColumns(counts);
  const total = columns.reduce((sum, { count }) => sum + count, 0);
  if (total === 0) return null;

  return (
    <ColumnChart
      title="What I worked on"
      subtitle="Runs finished that day"
      idPrefix={`runs-by-class-${day}`}
      summary={`What I worked on: ${columns.map(({ key, count }) => `${count} ${classLabel(key)}`).join(", ")}`}
      columns={columns.map(({ key, count }) => ({
        key,
        value: count,
        valueLabel: String(count),
        name: classLabel(key),
        ariaLabel: `${classLabel(key)}: ${count} ${count === 1 ? "run" : "runs"}`,
        colorClass: CLASS_BG[key],
        detail: [
          { label: "Runs", value: String(count) },
          { label: "Share", value: shareLabel(count, total) },
        ],
      }))}
    />
  );
}
