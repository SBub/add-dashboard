import { describe, expect, it } from "vitest";
import { headerSection } from "./header-section";

describe("headerSection", () => {
  it("is watch for the daily log at /projects/log", () => {
    expect(headerSection("/projects/log")).toBe("watch");
    expect(headerSection("/projects/log/")).toBe("watch");
  });

  it("is watch for the overview and a project page", () => {
    expect(headerSection("/projects")).toBe("watch");
    expect(headerSection("/projects/SBub/adw-dashboard")).toBe("watch");
  });

  it("is watch for a trailing slash and a deeper path under /projects", () => {
    expect(headerSection("/projects/")).toBe("watch");
    expect(headerSection("/projects/a/b")).toBe("watch");
    expect(headerSection("/projects/SBub/adw-dashboard/extra")).toBe("watch");
  });

  it("is home for the root only", () => {
    expect(headerSection("/")).toBe("home");
    expect(headerSection("/projects/log")).not.toBe("home");
    expect(headerSection("/projects")).not.toBe("home");
    expect(headerSection("/hire")).not.toBe("home");
  });

  it("is null for near misses and routes in no section", () => {
    expect(headerSection("/projectsx")).toBeNull();
    expect(headerSection("/projects-old")).toBeNull();
    expect(headerSection("/watch")).toBeNull();
    expect(headerSection("/watch/")).toBeNull();
    expect(headerSection("/watchx")).toBeNull();
    expect(headerSection("/watch-old")).toBeNull();
    expect(headerSection("/watch/anything")).toBeNull();
    expect(headerSection("/summary")).toBeNull();
    expect(headerSection("/about")).toBeNull();
    expect(headerSection("")).toBeNull();
  });

  it("is writing for /writing and every post below it", () => {
    expect(headerSection("/writing")).toBe("writing");
    expect(headerSection("/writing/")).toBe("writing");
    expect(headerSection("/writing/hello")).toBe("writing");
    expect(headerSection("/writingx")).toBeNull();
    expect(headerSection("/writing-old")).toBeNull();
  });

  it("never puts /writing in another section", () => {
    expect(headerSection("/writing")).not.toBe("watch");
    expect(headerSection("/writing")).not.toBe("home");
    expect(headerSection("/writing")).not.toBe("hire");
  });

  it("is hire for /hire only", () => {
    expect(headerSection("/hire")).toBe("hire");
    expect(headerSection("/hire/")).toBe("hire");
    expect(headerSection("/hirex")).toBeNull();
    expect(headerSection("/hire-me")).toBeNull();
  });

  it("never puts the root, the daily log or the overview in the hire section", () => {
    expect(headerSection("/")).not.toBe("hire");
    expect(headerSection("/projects/log")).not.toBe("hire");
    expect(headerSection("/projects")).not.toBe("hire");
  });

  it("never puts the root and the watch section together", () => {
    expect(headerSection("/")).not.toBe("watch");
  });
});
