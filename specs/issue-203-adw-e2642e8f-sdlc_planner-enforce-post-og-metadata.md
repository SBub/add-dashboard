# Chore: Enforce Open Graph metadata for every post in CI

## Metadata

issue_number: `203`
adw_id: `e2642e8f`
issue_json: `{"number":203,"title":"Enforce Open Graph metadata for every post in CI"}`

## Chore Description

Every published post must ship complete link-preview metadata (Open Graph and Twitter card), and CI
must fail when any registered post loses it. Today nothing checks it except one browser journey on
`/writing/my-moat`.

Add a check that discovers posts from `POST_ENTRIES` (never a hardcoded slug list), skips drafts, and
asserts per post, against the post's own `meta`:

- `<title>` equals `meta.title`; `meta name="description"` equals `meta.description`;
- `link rel="canonical"` and `og:url` end with `/writing/<slug>`;
- `og:title` and `og:description` equal title and description; `og:type` is `article`;
  `og:site_name` is `SITE_NAME`;
- `og:image` contains `/writing/<slug>/opengraph-image/`; `og:image:width` is `1200`,
  `og:image:height` is `630`, `og:image:type` is `image/png`, `og:image:alt` is non-empty;
- `twitter:card` is `summary_large_image`.

It must run in `.github/workflows/ci.yml`, need no network, and change nothing about how the tags are
produced (`generateMetadata`, `opengraph-image.tsx`, `metadataBase`, `siteUrl` stay untouched).

### Chosen approach: post-build check (the issue's option 2), and why

Option 1 (a unit test calling `generateMetadata` and `generateImageMetadata`) cannot assert what the
issue asks for:

- `generateMetadata` never sets `twitter` at all. The `twitter:card`, `twitter:title`,
  `twitter:image` tags in the served HTML are derived by Next's metadata resolver from `openGraph`
  plus the `opengraph-image` file convention. A unit test would have to re-implement or reach into
  Next internals to see `summary_large_image`.
- `og:image`, `og:image:width/height/type/alt` come from the file convention (`opengraph-image.tsx`
  merged into the page's metadata by Next), not from `generateMetadata`'s return value. Calling
  `generateImageMetadata` only proves the function's output, not that Next attaches the image to the
  page (a renamed file or a broken route would pass).
- The final `<title>` and absolute URLs depend on the root layout's metadata merge and
  `metadataBase`, which a unit test of the page function never exercises.

The prerendered HTML at `.next/server/app/writing/<slug>.html` is exactly what production serves
(verified: it contains every tag listed above, see Notes). Asserting against it covers the whole
pipeline with no reimplementation, so the check runs right after `yarn build` as `yarn check:og`.

The check still needs each post's `meta` (to compare title and description, and to skip drafts),
which means loading the `.mdx` modules through `POST_ENTRIES`. It is therefore written as a vitest
file run under its own small config (`vitest.og.config.ts`) that adds an MDX transform
(`@mdx-js/rollup`) and the `@` alias. Keeping it out of `vitest.config.ts` means `yarn test` (CI and
lefthook pre-push) never needs a build, and the existing unit layer is untouched.

## Relevant Files

Use these files to resolve the chore:

- `README.md`: repository overview (no change; it describes no feature).
- `AGENTS.md`: rules (Yarn only, no em-dashes, conventional commits with no trailers, profile
  headings never renamed or reordered).
- `.adw/project.md`: the ADW profile; its Tests section must list the new `yarn check:og` step
  after `yarn build`, under the existing heading.
- `docs/conditional-docs.md`: index; the `app_docs/writing.md` line matches this task (a post's Open
  Graph image and metadata), and should mention the metadata check.
- `app_docs/writing.md`: feature doc for posts and their metadata; gets a section describing the
  check, a Rules line, and this spec under Specifications.
- `src/content/posts/index.ts`: `POST_ENTRIES`, the only source of posts for the check.
- `src/lib/posts.ts`: `getPosts` / `parsePostMeta`; the check loads posts through `getPosts()` and
  filters drafts itself (vitest runs with `NODE_ENV=test`, so `visiblePosts` keeps drafts).
- `src/lib/site-url.ts`: `SITE_NAME`, the expected `og:site_name`.
- `src/app/writing/[slug]/page.tsx`: `generateMetadata` (read only; used for the negative tests,
  never changed in the final diff).
- `src/app/writing/[slug]/opengraph-image.tsx`: `size`, `contentType`, `generateImageMetadata`
  (read only).
- `src/app/layout.tsx`: `metadataBase` (read only).
- `src/content/posts/registry.test.ts`: existing test that guarantees directory and registry agree;
  model for style (describe/it, `@/` imports).
- `vitest.config.ts`: the unit config; unchanged (stays `src/**/*.test.ts`, no MDX).
- `package.json`: add the `check:og` script and the `@mdx-js/rollup` devDependency.
- `knip.json`: may need the new config and test file declared if knip does not pick them up.
- `.github/workflows/ci.yml`: add `yarn check:og` after `yarn build`.
- `lefthook.yml`: read only; no change (the check needs a build, so it does not belong in a hook).
- `tsconfig.json`: read only; it includes `**/*.ts`, so the new files are typechecked; `@types/mdx`
  already types `*.mdx` imports.

### New Files

- `vitest.og.config.ts`: vitest config for the post-build check only: `@` alias (same as
  `vitest.config.ts`), `@mdx-js/rollup` plugin, `test.include: ["scripts/check-post-metadata.test.ts"]`.
- `scripts/check-post-metadata.test.ts`: the check itself.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add the MDX transform dependency

- `yarn add -D @mdx-js/rollup@3.1.1` (same version as the installed `@mdx-js/loader` 3.1.1, so the
  same `@mdx-js/mdx` compiler is reused). Never npm or npx.
- Confirm `yarn.lock` and `package.json` changed only for this package. A peer warning about
  `rollup` is expected (vite 8 is rolldown-based) and harmless; confirm in step 3 that the plugin
  actually transforms `.mdx` under vitest.
- If `@mdx-js/rollup` does not work under vite 8, remove it and instead add `@mdx-js/mdx@3.1.1` as
  a devDependency with a minimal inline plugin in `vitest.og.config.ts`
  (`{ name: "mdx", enforce: "pre", async transform(code, id) { if (!id.endsWith(".mdx")) return; const out = await compile(code, { jsx: false }); return { code: String(out.value), map: null }; } }`).
  Record which one was used in the doc.

### 2. Create `vitest.og.config.ts`

- `defineConfig` from `vitest/config`, `plugins: [mdx()]` (default `@mdx-js/rollup` options: no
  `providerImportSource`, so compiled posts import only `react/jsx-runtime`).
- `resolve.alias`: `{ "@": new URL("./src", import.meta.url).pathname }`, copied from
  `vitest.config.ts` with the same comment style.
- `test.include: ["scripts/check-post-metadata.test.ts"]`.
- A short header comment: runs only after `yarn build`, reads the prerendered HTML, see
  `app_docs/writing.md`.

### 3. Write `scripts/check-post-metadata.test.ts`

- Header comment (no em-dashes): what it checks, that it reads `.next/server/app/writing/<slug>.html`
  after `yarn build`, that posts come from `POST_ENTRIES` through `getPosts()`, drafts skipped, no
  network.
- Load posts: `const posts = (await getPosts()).filter((post) => !post.meta.draft);` (top-level
  await or inside `describe` via `it`; prefer computing once at module level with top-level await,
  which vitest supports, so `it.each`/a loop can generate one test per post named by slug).
- Guard: one `it` asserting `posts.length` equals the count of non-draft entries and is greater
  than 0, and `console.log(\`check:og: ${posts.length} posts checked\`)` so the count is visible in
  CI output.
- Helpers (pure, in the file):
  - `readPostHtml(slug)`: `readFileSync(join(".next/server/app/writing", \`${slug}.html\`), "utf8")`;
if `existsSync`is false, throw`Post "<slug>": .next/server/app/writing/<slug>.html is missing; run yarn build first`.
  - `decode(value)`: unescape the HTML entities React emits in attributes and text (`&amp;`,
    `&lt;`, `&gt;`, `&quot;`, `&#x27;`, `&#39;`), so a title with an apostrophe or ampersand
    compares equal to `meta.title`.
  - `metaContent(html, attr, key)`: find the `<meta ...>` tag whose `property` (or `name`) equals
    `key` and return its decoded `content`, or `undefined`. Parse each `<meta[^>]*>` tag's attributes
    with a regex over `(\w[\w:-]*)="([^"]*)"` rather than assuming attribute order.
  - `linkHref(html, rel)` for `link rel="canonical"`; `titleText(html)` for `<title>([^<]*)</title>`
    (trimmed, decoded).
- For each post, one `it(slug, ...)` with every assertion labelled by slug and tag, using vitest's
  message argument so a failure names both, for example
  `expect(metaContent(html, "property", "og:type"), \`${slug}: og:type\`).toBe("article")`:
  - `<title>` === `meta.title`; `name="description"` === `meta.description`;
  - canonical href and `og:url` end with `/writing/${slug}`;
  - `og:title` === `meta.title`; `og:description` === `meta.description`; `og:type` === `article`;
    `og:site_name` === `SITE_NAME` (imported from `@/lib/site-url`);
  - `og:image` contains `/writing/${slug}/opengraph-image/`; `og:image:width` === `"1200"`;
    `og:image:height` === `"630"`; `og:image:type` === `"image/png"`; `og:image:alt` is a non-empty
    string;
  - `name="twitter:card"` === `summary_large_image`.
- Never hardcode a slug, a host or a count. Do not import `page.tsx` or `opengraph-image.tsx`.

### 4. Wire the script

- `package.json` scripts: add `"check:og": "vitest run --config vitest.og.config.ts"` after `test`.

### 5. Run it in CI

- `.github/workflows/ci.yml`: add `- run: yarn check:og` directly after `- run: yarn build`.
- Do not add it to `lefthook.yml` (it needs a build; the hooks never build).

### 6. Keep knip clean

- Run `yarn knip`. If it reports `vitest.og.config.ts`, `scripts/check-post-metadata.test.ts` or
  `@mdx-js/rollup` as unused, declare them: add `vitest.og.config.ts` and
  `scripts/check-post-metadata.test.ts` to `knip.json`'s `entry` (next to
  `scripts/backfill-changelog.ts`) or configure the vitest plugin's `config` to include both
  configs. Do not add `@mdx-js/rollup` to `ignoreDependencies` if declaring the config fixes it.

### 7. Prove it passes, then run the negative tests (none of these edits may remain)

- `yarn build`, then `yarn check:og`: passes and prints `2 posts checked` (`my-moat`,
  `feature-flags`).
- Remove `type: "article"` from `generateMetadata` in `src/app/writing/[slug]/page.tsx`, `yarn build`,
  `yarn check:og`: fails, and the message names the post(s) and `og:type`. Revert.
- Remove `siteName: SITE_NAME` from the same `openGraph`, rebuild, rerun: fails naming
  `og:site_name`. Revert (and restore the import if removed).
- Add a throwaway `src/content/posts/og-check-sample.mdx` with a valid, non-draft `meta` and a
  one-line body, plus its `POST_ENTRIES` line; rebuild, rerun: passes and prints `3 posts checked`
  with no edit to the check. Delete the file and the registry line.
- `git diff` and `git status` must show none of these edits afterwards.

### 8. Documentation

- `app_docs/writing.md`:
  - add `specs/issue-203-adw-e2642e8f-sdlc_planner-enforce-post-og-metadata.md` under
    Specifications;
  - add a `### The metadata check` subsection after "Metadata and the Open Graph image": what
    `yarn check:og` asserts, that it reads `.next/server/app/writing/<slug>.html` after `yarn build`,
    that posts come from `POST_ENTRIES` via `getPosts()` with drafts skipped (so a new post is
    covered with no edit), that it uses its own `vitest.og.config.ts` with the MDX transform so
    `yarn test` stays build-free, why it checks built HTML rather than `generateMetadata` (twitter
    tags and the image tags are produced by Next, not by the function), and that CI runs it right
    after `yarn build`;
  - add a Rules line: every non-draft post must pass `yarn check:og`; never hardcode a slug list in
    the check, and a change to what a post's tags contain changes the check in the same commit.
- `docs/conditional-docs.md`: extend the `app_docs/writing.md` line with "or the post metadata
  check (`yarn check:og`)".
- `.adw/project.md`: in `## Tests` only (no heading renamed, added or reordered), append after
  `build \`yarn build\``: `then the post metadata check \`yarn check:og\` (vitest under
  \`vitest.og.config.ts\`, reads the built \`.next/server/app/writing/<slug>.html\`, so it runs only
  after a build)`. Mention in the "one test layer" paragraph that this check is the one exception,
  run after the build.
- No em-dash characters anywhere (a grep for U+2014 over the changed files returns nothing).

### 9. Run the Validation Commands

## Test Coverage

- `scripts/check-post-metadata.test.ts` (post-build check layer: vitest run by `yarn check:og` after
  `yarn build`, alongside the profile's unit layer `src/**/*.test.ts`, which stays build-free). It
  catches any non-draft post served without the required title, description, canonical, Open Graph
  or Twitter card tags, which nothing catches today (only an agent-driven journey looks at
  `og:title`, on one slug). The negative tests in step 7 prove it fails without the tags.
- No E2E spec or `e2e/*.md` journey: nothing user-visible changes, and the profile has no E2E code
  suite. No screenshots are needed for review.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn format:check`: new files and the edited YAML, JSON and Markdown are Prettier-clean.
- `yarn lint`: the new config and test file pass ESLint.
- `yarn typecheck`: the new `.ts` files (included by `tsconfig.json`) typecheck, including the
  `.mdx` imports through `@types/mdx`.
- `yarn knip`: no unused file, export or dependency from the new config, test or `@mdx-js/rollup`.
- `yarn test`: the existing unit suite still passes and does not pick up the new check.
- `yarn build`: the app still builds and produces `.next/server/app/writing/<slug>.html`.
- `yarn check:og`: the new check passes on the fresh build and prints the number of posts checked.
- `git status --porcelain`: no leftover negative-test edits, throwaway post, `next-env.d.ts` or
  `.ports.env` staged.

## Notes

- Verified in this worktree's existing `.next/server/app/writing/my-moat.html`: `<title>` (with
  surrounding whitespace, so trim), `meta name="description"`, `link rel="canonical"`, `og:title`,
  `og:description`, `og:url`, `og:site_name`, `og:image` (`.../writing/my-moat/opengraph-image/og?<hash>`),
  `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`, `og:type`,
  `article:published_time`, `article:author`, `twitter:card` (`summary_large_image`) and the twitter
  title, description and image tags. No `twitter` key exists in `generateMetadata`: those tags are
  Next's fallback from `openGraph`, which is why a unit test of the function cannot assert them.
- Without `SITE_URL` (as in CI) the absolute URLs use `http://localhost:3000`; the check only
  asserts suffixes and path fragments, so it passes for any host and never hardcodes one.
- `@mdx-js/rollup@3.1.1` exists (checked with `yarn npm info`); its peer is `rollup >=2`.
- The check reads only local files: no fetch, no server start, no port.
- Commit with a bare conventional type (`chore: ...`), no trailers.
