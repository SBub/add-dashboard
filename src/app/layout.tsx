import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandLink, HireLink, SectionNav } from "@/components/SectionNav";
import { HEADER_LAYER } from "@/lib/layers";
import { SITE_NAME, siteUrl } from "@/lib/site-url";

import "./globals.css";

// metadataBase turns every relative metadata URL (og:image, og:url, the
// canonical link) into an absolute one on the public address. SITE_URL is
// read once, at build time, when this module is evaluated (see
// src/lib/site-url.ts for its fallbacks).
export const metadata: Metadata = {
  metadataBase: new URL(
    siteUrl({
      SITE_URL: process.env.SITE_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  ),
  openGraph: { siteName: SITE_NAME },
  title: "Sviatlana Buben, building in public",
  description:
    "Sviatlana Buben, product engineer, building her products in public with ADW, her AI developer workflow.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header
          className={`sticky top-0 ${HEADER_LAYER} border-b border-neutral-200 bg-background dark:border-neutral-800`}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-3 sm:gap-6">
              <BrandLink />
              <SectionNav />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-xs text-neutral-500 sm:inline dark:text-neutral-400">
                Built with ADW, my AI developer workflow
              </span>
              <HireLink />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
