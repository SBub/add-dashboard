import posthog from "posthog-js";

// PostHog browser analytics. Both variables are public and inlined at build
// time. Without them (local dev, ADW worktrees, e2e) nothing is initialised
// and every posthog.capture call is a no-op.
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (projectToken && posthogHost) {
  posthog.init(projectToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
