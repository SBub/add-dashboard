import { describe, expect, it } from "vitest";
import { siteUrl } from "./site-url";

const VERCEL = "adw-dashboard-sbub.vercel.app";

describe("siteUrl", () => {
  it("returns SITE_URL as given when it is clean", () => {
    expect(siteUrl({ SITE_URL: "https://build.issebya.com" })).toBe("https://build.issebya.com");
  });

  it("strips a trailing comma, slashes and whitespace", () => {
    expect(siteUrl({ SITE_URL: "https://build.issebya.com," })).toBe("https://build.issebya.com");
    expect(siteUrl({ SITE_URL: "https://build.issebya.com/" })).toBe("https://build.issebya.com");
    expect(siteUrl({ SITE_URL: "  https://build.issebya.com/, \n" })).toBe(
      "https://build.issebya.com",
    );
  });

  it("accepts http", () => {
    expect(siteUrl({ SITE_URL: "http://localhost:4000" })).toBe("http://localhost:4000");
  });

  it("prefers SITE_URL over the Vercel domain", () => {
    expect(
      siteUrl({ SITE_URL: "https://build.issebya.com", VERCEL_PROJECT_PRODUCTION_URL: VERCEL }),
    ).toBe("https://build.issebya.com");
  });

  it("falls back when SITE_URL is invalid", () => {
    expect(siteUrl({ SITE_URL: "build.issebya.com" })).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: "ftp://build.issebya.com" })).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: "https://" })).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: "not a url", VERCEL_PROJECT_PRODUCTION_URL: VERCEL })).toBe(
      `https://${VERCEL}`,
    );
  });

  it("falls back to the Vercel production domain when SITE_URL is unset or empty", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: VERCEL })).toBe(`https://${VERCEL}`);
    expect(siteUrl({ SITE_URL: "", VERCEL_PROJECT_PRODUCTION_URL: VERCEL })).toBe(
      `https://${VERCEL}`,
    );
  });

  it("falls back to localhost when neither variable is set", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: " ", VERCEL_PROJECT_PRODUCTION_URL: "" })).toBe(
      "http://localhost:3000",
    );
  });
});
