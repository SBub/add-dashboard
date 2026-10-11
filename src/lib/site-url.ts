// The public address of the site, the base every absolute URL in the page
// metadata is resolved against (metadataBase in the root layout: og:image,
// og:url, the canonical link). Pure: the caller passes the environment, so
// nothing here reads process.env, the clock or the request.

// The site's name as Open Graph shows it (og:site_name); the brand of the
// header's BrandLink.
export const SITE_NAME = "Sviatlana Buben";

const LOCAL_SITE_URL = "http://localhost:3000";

interface SiteUrlEnv {
  SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}

// Trims whitespace, then strips trailing commas and slashes (a value pasted
// as "https://build.issebya.com," or "https://build.issebya.com/"). Returns
// null unless what is left parses as an http(s) URL.
function normalise(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const value = raw.trim().replace(/[,/\s]+$/, "");
  if (!/^https?:\/\/[^/]/i.test(value) || !URL.canParse(value)) return null;
  return value;
}

// SITE_URL when it is a valid http(s) URL; otherwise the Vercel production
// domain (VERCEL_PROJECT_PRODUCTION_URL, a bare host Vercel sets at build
// time) over https; otherwise the local server.
export function siteUrl(env: SiteUrlEnv): string {
  const configured = normalise(env.SITE_URL);
  if (configured) return configured;
  const host = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercel = host ? normalise(`https://${host}`) : null;
  return vercel ?? LOCAL_SITE_URL;
}
