import { describe, expect, it } from "vitest";
import {
  changelogCountsLabel,
  isChangelogId,
  parseChangelogMeta,
  sortChangelogNewestFirst,
} from "./changelog";

const VALID = {
  date: "2026-10-09",
  pr: 163,
  title: "promote develop to master",
  kind: "release",
  counts: { features: 5, fixes: 5, chores: 10 },
};

describe("parseChangelogMeta", () => {
  it("parses a valid meta to exactly its five fields", () => {
    expect(parseChangelogMeta("2026-10-09-pr163", { ...VALID, extra: 1 })).toEqual(VALID);
  });

  it("throws naming the entry and the field", () => {
    const id = "2026-10-09-pr163";
    const cases: [unknown, string][] = [
      [null, "meta"],
      [[], "meta"],
      [{ ...VALID, date: "2026-02-30" }, "date"],
      [{ ...VALID, date: 20261009 }, "date"],
      [{ ...VALID, pr: 0 }, "pr"],
      [{ ...VALID, pr: 1.5 }, "pr"],
      [{ ...VALID, title: " " }, "title"],
      [{ ...VALID, kind: "sync" }, "kind"],
      [{ ...VALID, counts: null }, "counts"],
      [{ ...VALID, counts: { features: -1, fixes: 0, chores: 0 } }, "counts"],
      [{ ...VALID, counts: { features: 1, fixes: 0 } }, "counts"],
    ];
    for (const [raw, field] of cases) {
      expect(() => parseChangelogMeta(id, raw)).toThrow(`Changelog entry "${id}": ${field} `);
    }
  });

  it("throws when the id disagrees with the date or the pull request", () => {
    expect(() => parseChangelogMeta("2026-10-08-pr163", VALID)).toThrow(
      'Changelog entry "2026-10-08-pr163": id ',
    );
    expect(() => parseChangelogMeta("2026-10-09-pr162", VALID)).toThrow("id must be");
  });
});

describe("isChangelogId", () => {
  it("accepts <YYYY-MM-DD>-pr<N> only", () => {
    expect(isChangelogId("2026-10-09-pr163")).toBe(true);
    for (const id of ["2026-10-09", "pr163", "../x", "_", "2026-10-09-pr163.mdx", ""]) {
      expect(isChangelogId(id)).toBe(false);
    }
  });
});

describe("sortChangelogNewestFirst", () => {
  it("orders by date, then pull request, newest first, without mutating", () => {
    const entries = [
      { meta: { date: "2026-10-05", pr: 37 } },
      { meta: { date: "2026-10-03", pr: 8 } },
      { meta: { date: "2026-10-06", pr: 77 } },
      { meta: { date: "2026-10-05", pr: 65 } },
      { meta: { date: "2026-10-06", pr: 79 } },
    ];
    const copy = [...entries];
    expect(sortChangelogNewestFirst(entries).map((e) => e.meta.pr)).toEqual([79, 77, 65, 37, 8]);
    expect(entries).toEqual(copy);
  });
});

describe("changelogCountsLabel", () => {
  it("counts every section, with singulars", () => {
    expect(
      changelogCountsLabel({ kind: "release", counts: { features: 3, fixes: 2, chores: 4 } }),
    ).toBe("3 features, 2 fixes, 4 chores");
    expect(
      changelogCountsLabel({ kind: "release", counts: { features: 1, fixes: 1, chores: 1 } }),
    ).toBe("1 feature, 1 fix, 1 chore");
    expect(
      changelogCountsLabel({ kind: "release", counts: { features: 1, fixes: 0, chores: 0 } }),
    ).toBe("1 feature, 0 fixes, 0 chores");
  });

  it("reads Branch sync for an empty release and Revert for a revert", () => {
    const zero = { features: 0, fixes: 0, chores: 0 };
    expect(changelogCountsLabel({ kind: "release", counts: zero })).toBe("Branch sync");
    expect(changelogCountsLabel({ kind: "revert", counts: zero })).toBe("Revert");
  });
});
