# Chore: Vocabulary: relabel the dashboard for hiring managers and small-business owners

## Metadata

issue_number: `166`
adw_id: `1eacd918`
issue_json: `{"number":166,"title":"Vocabulary: relabel the dashboard for hiring managers and small-business owners"}`

## Chore Description

Copy-only change. The dashboard's visible labels move from pipeline jargon to the words its two
audiences use (a hiring manager looking for a product engineer, a small-business owner who wants
work taken off their plate). No route, data, query, colour, section key, class name or layout
behaviour changes.

Exact old to new strings:

- Header brand `ADW Dashboard` to `Sviatlana Buben, building in public`; below `sm` only
  `Sviatlana Buben` shows (the `, building in public` part in a `hidden sm:inline` span).
- Header tagline `AI Developer Workflow runs` to `Built with ADW, my AI developer workflow` (still
  `hidden sm:inline`).
- Header section link `Projects` to `Watch me build` (`href="/projects"` unchanged).
- Header button `Hire me` to `Work with me` (`href="/hire"`, `HIRE_ACCENT` unchanged).
- Root metadata: `title` `Sviatlana Buben, building in public`; `description`
  `Sviatlana Buben, product engineer, building her products in public with ADW, her AI developer workflow.`
- `/` metadata title: `Sviatlana Buben: what an AI developer workflow ships`.
- Project page `generateMetadata`: `${project.display_name} | Sviatlana Buben`.
- `/hire` metadata: `title` `Work with me`; `description`
  `Work with Sviatlana Buben: product engineering on contract or full-time, or AI that takes work off your plate.`
- Section heading titles: `Active` to `Building now` (both `/projects` and the project page),
  `Queue` to `Up next`, `History` to `Shipped`. Descriptions and details unchanged, except the
  Active `detail` "stays here, not in history" to "stays here, not in Shipped" (both pages).
- `ClassColumnChart` title `Work by class` to `What I worked on`; `PhaseColumnChart` title
  `Cost by phase` to `What each step cost`. Subtitles unchanged. Each chart's `summary` string
  starts with the new title. `ModelColumnChart` unchanged.
- `WorkerStatus`: `Worker online` to `Ready to build`, `Worker offline` to `Offline`,
  `Worker status...` to `Checking status...`. Suffix, colours and the 90 s rule unchanged.
- `/hire`: heading `Hire me` to `Work with me`; select label `What are you hiring for?` to
  `What brings you here?`; option labels `Product engineer` to
  `I need a product engineer (contract or full-time)`, `AI consulting` to
  `I want to take work off my own plate`; textarea label `What would you like to work on?` to
  `What's eating your time, or what are you building?`. `HIRE_INTRO` stays placeholder.

Constraints: `OFFERS` values stay `["Product engineer", "AI consulting"]` (they are validated,
go in the email subject and are filtered on); only the visible `<option>` text changes, via a new
`OFFER_LABELS: Record<Offer, string>` in `src/content/hire.ts`. Routes and `HeaderSection` keys
stay. Issue class names (`feature`, `chore`, `bug`, `patch`, `other`) stay everywhere. The
sidebar's `Projects` heading and nav label in `src/app/(dashboard)/layout.tsx` stay.
`ADW_UI_DISPLAY_NAME=ADW Dashboard` in `.env.example` stays. `README.md`'s `# ADW Dashboard` title
stays; only its link text `Hire me page` becomes `Work with me page`. The `Sections` nav label
stays. Nothing under `specs/` is edited (except this plan). No em-dashes anywhere.

## Relevant Files

Use these files to resolve the chore:

Docs read before planning (their `docs/conditional-docs.md` lines match: header links, section
headings, worker widget, charts, `/hire` and `src/content/hire.ts`):

- `app_docs/routing-and-navigation.md` - describes the header's links and their current-section
  marking; quotes "Projects" and "Hire me".
- `app_docs/screens-and-components.md` - section headings, worker widget states ("Worker
  online/offline/status..."), the Hire me button's accent.
- `app_docs/summary.md` - names "Work by class", "Cost by phase" and the `/` document title.
- `app_docs/hire.md` - the `/hire` page doc; title "Hire me page", the "Hire me button", the form's
  fields (needs `OFFER_LABELS` and the new labels).
- `app_docs/project-page.md` - Active, Queue and History sections (headings now read Building now,
  Up next, Shipped).
- `app_docs/error-and-loading-boundaries.md` - header links' Suspense fallbacks ("Projects and Hire
  me links").
- `app_docs/clock-and-prerender.md` - quotes "Worker status..." as the shell text (lines ~62, ~86).

Source:

- `src/components/SectionNav.tsx` - brand, `Projects` section link, `Hire me` button, each twice
  (Suspense fallback and `HeaderLink`), plus comments naming them.
- `src/app/layout.tsx` - root metadata and header tagline.
- `src/app/page.tsx` - `/` metadata title.
- `src/app/(dashboard)/projects/page.tsx` - `Active` heading and its detail.
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx` - `generateMetadata` title suffix,
  `Queue`, `Active` (and detail), `History` headings; comments naming them may stay as code
  concepts but the visible titles change.
- `src/components/ClassColumnChart.tsx`, `src/components/PhaseColumnChart.tsx` - chart titles and
  `summary` strings.
- `src/components/WorkerStatus.tsx` - three state labels and the doc comment quoting
  "Worker status...".
- `src/app/hire/page.tsx` - metadata, heading, select label, option text, textarea label.
- `src/content/hire.ts` - `OFFERS`; gains `OFFER_LABELS`.
- `src/lib/header-section.ts` - header comment names "Projects" and "Hire me".
- `src/lib/accent.ts`, `src/app/globals.css` - comments naming "the header's Hire me button".
- `src/lib/hire-request.test.ts`, `src/app/actions/send-hire-request.test.ts` - must pass
  unchanged (subject `Hire: Product engineer - <name>`).
- `src/components/LoadingSkeletons.test.ts`, `src/components/RunRow.test.ts` - the existing
  `renderToStaticMarkup` pattern the new tests copy.

Docs, index and profile:

- `docs/conditional-docs.md` - the hire line says "Hire me button".
- `.adw/project.md` - Review section names `Active`/Queue/History headings, "Hire me button",
  "Worker status..." and "Worker offline", and the work-by-class / cost-by-phase charts; keep the
  nine `##` headings untouched.
- `README.md` - link text `Hire me page` only.

e2e journeys quoting old on-screen labels:

- `e2e/test_header_section_active.md`, `e2e/test_hire_page.md`, `e2e/test_worker_status_widget.md`,
  `e2e/test_day_card_charts.md`, `e2e/test_sticky_header.md`,
  `e2e/test_connection_indicator_scope.md`, `e2e/test_active_runs_shared_entry.md`,
  `e2e/test_row_full_title_top_align.md`, `e2e/test_projects_skeleton_fallbacks.md`,
  `e2e/test_queue_row_single_line.md`, `e2e/test_run_row_phase_label.md`,
  `e2e/test_history_card_fields.md`, `e2e/test_section_tooltip_layering.md`,
  `e2e/test_history_page_turn.md` and any other `e2e/*.md` a grep finds.

### New Files

- `src/components/SummaryCharts.test.ts` - renders both relabelled charts and asserts title and
  summary text.
- `src/content/hire.test.ts` - pins `OFFERS` values and `OFFER_LABELS` text.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Offer labels in `src/content/hire.ts`

- Keep `OFFERS` and `Offer` exactly as they are.
- Add, below `Offer`, with a one-line comment saying the value is what the action validates and
  the subject carries, the label is only the visible text:
  ```ts
  export const OFFER_LABELS: Record<Offer, string> = {
    "Product engineer": "I need a product engineer (contract or full-time)",
    "AI consulting": "I want to take work off my own plate",
  };
  ```

### 2. `/hire` page (`src/app/hire/page.tsx`)

- Import `OFFER_LABELS` alongside `OFFERS`.
- `metadata`: `title: "Work with me"`, `description: "Work with Sviatlana Buben: product engineering on contract or full-time, or AI that takes work off your plate."`.
- Select label: `What brings you here?`.
- Options: `<option key={offer} value={offer}>{OFFER_LABELS[offer]}</option>` (value unchanged).
- Textarea label: `What's eating your time, or what are you building?` (JSX text: use `&apos;`
  or `{"What's eating..."}` if `react/no-unescaped-entities` flags the apostrophe; check
  `yarn lint`).
- `<h1>`: `Work with me`.

### 3. Header (`src/components/SectionNav.tsx`, `src/app/layout.tsx`)

- `SectionNav`: both the fallback `Link` and the `HeaderLink` text `Projects` become
  `Watch me build`. `aria-label="Sections"` stays.
- `BrandLink`: both copies of `ADW Dashboard` become
  `Sviatlana Buben<span className="hidden sm:inline">, building in public</span>`. Keep fallback
  and live markup identical so the streamed swap does not shift.
- `HireLink`: both copies of `Hire me` become `Work with me`.
- Rewrite the comments: top comment "the Hire me button" to "the Work with me button"; "The solid
  Hire me button" to "The solid Work with me button". Mention the link labels by their new text.
- `src/app/layout.tsx`: `metadata.title` `Sviatlana Buben, building in public`, `description`
  `Sviatlana Buben, product engineer, building her products in public with ADW, her AI developer workflow.`;
  tagline span text `Built with ADW, my AI developer workflow` (classes unchanged).
- `src/lib/header-section.ts` comment: `"Projects"` to `"Watch me build"`, `"Hire me"` to
  `"Work with me"`. Keys and logic unchanged.
- `src/lib/accent.ts` and `src/app/globals.css` comments: "Hire me button" to "Work with me
  button". `--header-height` value unchanged (the button keeps the same 2rem box).

### 4. Metadata on `/` and the project page

- `src/app/page.tsx`: `title: "Sviatlana Buben: what an AI developer workflow ships"`.
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx` `generateMetadata`:
  `` `${project.display_name} | Sviatlana Buben` ``.

### 5. Section headings

- `src/app/(dashboard)/projects/page.tsx`: `title="Building now"`; detail "stays here, not in
  history" to "stays here, not in Shipped". Description unchanged.
- Project page: `title="Up next"` (queue), `title="Building now"` (active, same detail edit),
  `title="Shipped"` (history). Descriptions and other details unchanged. Leave code identifiers
  (`queueHeading`, `activeHeading`, `HistoryTransition`, ...) as they are; reword a comment only if
  it quotes a heading's visible text.

### 6. Summary charts

- `ClassColumnChart`: `title="What I worked on"`, summary `` `What I worked on: ${...}` ``.
  Subtitle and `idPrefix` unchanged.
- `PhaseColumnChart`: `title="What each step cost"`, summaries
  `"What each step cost: no per-phase usage published."` and `` `What each step cost: ${...}` ``.
  Subtitle, `empty` text and `idPrefix` unchanged.
- `ModelColumnChart`: no change.

### 7. Worker status widget (`src/components/WorkerStatus.tsx`)

- `Worker online` to `Ready to build`, `Worker offline` to `Offline`, `Worker status...` to
  `Checking status...`, including the doc comment that quotes the shell text. Nothing else.

### 8. Unit tests

- `src/content/hire.test.ts`: assert `OFFERS` equals `["Product engineer", "AI consulting"]`, and
  `OFFER_LABELS` maps each to the exact new label (and has a key for every offer).
- `src/components/SummaryCharts.test.ts`, modelled on `RunRow.test.ts` (`createElement` +
  `renderToStaticMarkup`):
  - `ClassColumnChart` with counts e.g. `{ runs: 3, features: 2, bugs: 1, chores: 0, patches: 0 }`
    and a `day`: markup contains `What I worked on` and `Runs finished that day`, the summary
    starts `What I worked on: 2 feature` (use the `classLabel` output actually produced), and does
    not contain `Work by class`.
  - `PhaseColumnChart` with `phases: []`: markup contains
    `What each step cost: no per-phase usage published.`; with one phase, the summary starts
    `What each step cost: `; neither contains `Cost by phase`.
  - Assert on whatever element `ColumnChart` puts `summary` in (read `ColumnChart.tsx` first).
- Do not touch `hire-request.test.ts` or `send-hire-request.test.ts`.

### 9. Feature docs, index, profile, README

- `app_docs/routing-and-navigation.md`: header brand text (with the below-`sm` short form),
  `"Watch me build"` link, `Work with me` button, and the Rules/active-marking lines (~100-102):
  reword, do not delete, keeping the `"projects"`/`"hire"` section keys as they are.
- `app_docs/screens-and-components.md`: worker widget states (`Ready to build`, `Offline`,
  `Checking status...`), section heading titles where quoted, the Work with me button's accent
  line (~226), header tagline if described.
- `app_docs/clock-and-prerender.md`: `"Worker status..."` to `"Checking status..."` (two places).
- `app_docs/summary.md`: chart titles `What I worked on` and `What each step cost` (subtitles as
  now), `/` document title `Sviatlana Buben: what an AI developer workflow ships`. Say the class
  chart counts completed and failed runs, so its title does not say shipped, if the doc describes
  the chart's counts.
- `app_docs/hire.md`: title `# Work with me page`; overview "header's Work with me button"; form
  section: the select shows `OFFER_LABELS` while its value is the `OFFERS` entry, new label texts;
  add a Rules line (or reword an existing one): "Do not change an `OFFERS` value to change what
  the visitor reads; edit `OFFER_LABELS`. The value is validated, goes in the subject and is what
  the inbox filters on."
- `app_docs/project-page.md`: where it quotes visible heading text, say the sections render under
  the headings `Building now`, `Up next` and `Shipped`; conceptual section names in prose can stay
  but add one line mapping them.
- `app_docs/error-and-loading-boundaries.md` (~74-77): "Watch me build and Work with me links",
  "for Work with me, the button without `aria-current`".
- `docs/conditional-docs.md`: hire line "the Hire me button" to "the Work with me header button".
- `.adw/project.md` Review section only: `Building now` heading on `/projects`; project page
  "(header, Building now, Up next and Shipped sections)"; "The fuchsia Work with me button";
  worker widget reads "Checking status..." and "Offline"; chart names. Do not touch the `##`
  headings or any other section.
- `README.md`: `[Hire me page]` to `[Work with me page]`. Title stays.

### 10. e2e journeys

- `grep -rnE 'ADW Dashboard|Hire me|Worker (online|offline|status)|Work by class|Cost by phase|`(Active|Queue|History)`|What are you hiring|What would you like' e2e`
  and update every on-screen quote:
  - Header: brand `Sviatlana Buben` (at 375 the short form; desktop the full text), header link
    `Watch me build` in the `Sections` navigation, button `Work with me`.
  - Sidebar `Projects` navigation references stay as they are (the sidebar is not renamed).
  - Heading quotes `Active`/`Queue`/`History` to `Building now`/`Up next`/`Shipped`.
  - `e2e/test_worker_status_widget.md`: `Checking status...`, `Ready to build`, `Offline`.
  - `e2e/test_day_card_charts.md`: `What I worked on`, `What each step cost`; `Tokens by model`
    unchanged.
  - `e2e/test_hire_page.md`: heading and button `Work with me`; add a step verifying the select
    shows the two new labels with values `Product engineer` and `AI consulting`; step 18 at 375:
    the header shows `Sviatlana Buben`, `Watch me build` and `Work with me`, does not show
    `building in public`, and `document.documentElement.scrollWidth <= 375`.
  - `e2e/test_header_section_active.md`: brand and `Watch me build` marking; also verify
    `Work with me` has `aria-current="page"` on `/hire`.
- Update each journey's description/expected-results lines that quote the old text too.

### 11. Header width check (review evidence, not code)

- The brand grows from 13 to 35 characters. Confirm in the review screenshots that the header
  still sits on one row at `md` and up (the sidebar's sticky offset `--header-height` assumes one
  row there) and does not overflow at 375. If it wraps between `md` and `lg`, report it as a
  finding rather than changing layout in this chore (layout is out of scope).

### 12. Run the Validation Commands

- Run every command below; all must pass.

## Test Coverage

- `src/content/hire.test.ts` (vitest unit, `src/**/*.test.ts`): pins `OFFERS` values and the new
  `OFFER_LABELS` text; catches a future edit that changes the submitted value (and the email
  subject) when only the visible label should change. Fails today because `OFFER_LABELS` does not
  exist.
- `src/components/SummaryCharts.test.ts` (vitest unit with `renderToStaticMarkup`, the pattern
  `RunRow.test.ts` already uses): asserts the two chart titles and that each screen-reader
  `summary` starts with the new title; catches a title changed without its summary (or the
  reverse). Fails today on `Work by class` / `Cost by phase`.
- The header, headings, worker widget and `/hire` labels have no component test layer that can
  render them cheaply (`HeaderLink` needs the router, `WorkerStatus` imports the data layer); they
  are covered by the source grep in Validation Commands, the updated `e2e/*.md` journeys (an
  acceptance gate, listed as task 10) and the review screenshots.
- The existing `hire-request.test.ts` and `send-hire-request.test.ts` run unchanged and keep
  asserting the subject `Hire: Product engineer - <name>`.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn format` then `yarn format:check` - Prettier formatting of every changed file.
- `yarn lint` - ESLint, including JSX unescaped-entity rules for the new apostrophe label.
- `yarn typecheck` - `OFFER_LABELS` is `Record<Offer, string>`, so a missing offer fails here.
- `yarn knip` - `OFFER_LABELS` is used by the page and the test; no new dead export.
- `yarn test` - the two new test files plus the unchanged hire tests.
- `grep -rnE 'Hire me|Worker online|Worker offline|Worker status\.\.\.|Work by class|Cost by phase|ADW Dashboard|^\s*Projects\s*$|title="(Active|Queue|History)"' src | grep -v '\.test\.' | grep -v 'src/app/(dashboard)/layout.tsx'` - must print nothing. Negative check: temporarily set `title="Queue"` back in the project page, confirm the grep prints that line, then revert.
- `grep -rn 'AI Developer Workflow runs\|What are you hiring for\|What would you like to work on' src` - must print nothing.
- `grep -rnE 'Hire me|Worker (online|offline|status)|Work by class|Cost by phase' app_docs docs e2e .adw/project.md README.md` - must print nothing (`specs/` is excluded on purpose).
- `grep -rnP '\x{2014}' $(git diff --name-only develop...HEAD; git ls-files --others --exclude-standard)` - no em-dashes in changed files.
- `yarn build` - the production build still compiles and prerenders with the new copy.

## Notes

- The served-HTML checks in the issue (verification 3) and the e2e scenarios (verification 4) are
  for the test and review phases: `/` holds `Sviatlana Buben`, `Watch me build`, `Work with me`;
  `/projects` holds `Building now` and `Checking status...`; a project page holds `Up next`,
  `Building now`, `Shipped`; `/hire` holds `What brings you here?` and
  `<option value="Product engineer">I need a product engineer (contract or full-time)</option>`.
  React may render the apostrophe in the textarea label as `&#x27;`; that is fine.
- Never submit the `/hire` form with valid input against real Resend/Turnstile keys (profile,
  Protected).
- Out of scope: issue class names, "run"/"runs" wording elsewhere, `HIRE_INTRO` copy, routes,
  colours, layout, the sidebar's `Projects` heading, `.env.example`, the README title, `adws/` and
  `.claude/commands/`.
- Commits: Conventional Commits, bare type (`chore: ...`), no trailers (profile Documentation
  section overrides any attribution reminder).
