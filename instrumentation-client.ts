import posthog from "posthog-js";

// PostHog browser analytics, production only. All three variables are public
// and inlined at build time. NEXT_PUBLIC_VERCEL_ENV is set by Vercel itself
// ("production", "preview" or "development") and is absent in local builds,
// so local dev, ADW worktrees, e2e and preview deploys never initialise
// PostHog, even with a token in .env.local, and every posthog.capture call is
// a no-op.
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

if (isProduction && projectToken && posthogHost) {
  posthog.init(projectToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
