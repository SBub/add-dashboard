import { describe, expect, it } from "vitest";
import { isSidebarEntryCurrent } from "./nav-entry";

const dailyLog = (path: string) => isSidebarEntryCurrent(path, "/projects/log", false);
const changelog = (path: string) => isSidebarEntryCurrent(path, "/projects/changelog", true);

describe("isSidebarEntryCurrent", () => {
  it("marks Daily log current only on /projects/log", () => {
    expect(dailyLog("/projects/log")).toBe(true);
    expect(dailyLog("/projects/log/x")).toBe(false);
    expect(dailyLog("/projects")).toBe(false);
    expect(dailyLog("/projects/changelog")).toBe(false);
    expect(dailyLog("/projects/changelog/2026-10-09-pr163")).toBe(false);
  });

  it("marks Changelog current on its index and every entry", () => {
    expect(changelog("/projects/changelog")).toBe(true);
    expect(changelog("/projects/changelog/2026-10-09-pr163")).toBe(true);
  });

  it("never marks Changelog current elsewhere", () => {
    expect(changelog("/projects")).toBe(false);
    expect(changelog("/projects/log")).toBe(false);
    expect(changelog("/projects/changelogx")).toBe(false);
    expect(changelog("/projects/SBub/adw-dashboard")).toBe(false);
  });
});
