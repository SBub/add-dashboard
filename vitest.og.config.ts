// The post metadata check (`yarn check:og`) only. It runs after `yarn build`
// and reads the prerendered HTML under .next/server/app/writing/, so it stays
// out of vitest.config.ts and `yarn test` never needs a build. The MDX plugin
// lets the check load each post's meta through POST_ENTRIES. See
// app_docs/writing.md.
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [mdx()],
  resolve: {
    // Mirror tsconfig's "@/*" path so the check imports modules the way the app does
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: ["scripts/check-post-metadata.test.ts"],
    // Name each checked post and print the count, so CI output shows coverage
    reporters: ["verbose"],
  },
});
