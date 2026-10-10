import { describe, expect, it } from "vitest";
import { headerSection } from "./header-section";

describe("headerSection", () => {
  it("is watch for the summary at /watch", () => {
    expect(headerSection("/watch")).toBe("watch");
    expect(headerSection("/watch/")).toBe("watch");
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
    expect(headerSection("/watch")).not.toBe("home");
    expect(headerSection("/projects")).not.toBe("home");
    expect(headerSection("/hire")).not.toBe("home");
  });

  it("is null for near misses and routes in no section", () => {
    expect(headerSection("/projectsx")).toBeNull();
    expect(headerSection("/projects-old")).toBeNull();
    expect(headerSection("/watchx")).toBeNull();
    expect(headerSection("/watch-old")).toBeNull();
    expect(headerSection("/watch/anything")).toBeNull();
    expect(headerSection("/summary")).toBeNull();
    expect(headerSection("/about")).toBeNull();
    expect(headerSection("")).toBeNull();
  });

  it("is hire for /hire only", () => {
    expect(headerSection("/hire")).toBe("hire");
    expect(headerSection("/hire/")).toBe("hire");
    expect(headerSection("/hirex")).toBeNull();
    expect(headerSection("/hire-me")).toBeNull();
  });

  it("never puts the root, /watch or the overview in the hire section", () => {
    expect(headerSection("/")).not.toBe("hire");
    expect(headerSection("/watch")).not.toBe("hire");
    expect(headerSection("/projects")).not.toBe("hire");
  });

  it("never puts the root and the watch section together", () => {
    expect(headerSection("/")).not.toBe("watch");
  });
});
