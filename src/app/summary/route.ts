// The summary's old address (issue #83); the summary moved to /watch (issue
// #169), so the redirect follows it. A config redirect in next.config.ts
// always carries the request's query string to the destination, and the
// `?days` and `?project` filters no longer exist (issue #97), so this
// handler answers a bare, relative `/watch` and reads nothing from the request.
// It is the only file under src/app/summary/; there is no page here.
export function GET() {
  return new Response(null, { status: 308, headers: { Location: "/watch" } });
}
