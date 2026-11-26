# JAGUAR SPK Design System design system

This package defines the visual language for the project. Use it whenever you
build or restyle UI so every surface looks like the same product. It is a real
workspace package (`@workspace/jaguar-spk-design-system`): other artifacts depend
on it and import its theme and components directly.

## What's here

- `docs/references/component-inventory.md` — source-backed component catalog,
  build chunks, evidence, and pending/implemented status. Read it and the linked
  family reference before changing any cataloged component.
- `docs/references/v3-source.md` — provenance and porting boundaries for the
  user-provided JAGUAR SPK Design System v3 HTML reference. It is visual/content
  input only; its raw script is never served or executed.
- `docs/references/brand-id-2026-source.md` — source and confirmed scope for the
  additive, opt-in Brand ID 2026 color palette.
- `docs/references/logos/` — the original JAGUAR SPK emblem and wordmark.
- `docs/references/assets/` — retained source artwork used to derive card and
  button treatments.
- `tokens.json` — the single source of truth (DTCG format): colors (full light
  and dark sets), typography, spacing, and radius.
- `scripts/build-tokens.mjs` — generates the outputs below from `tokens.json`.
- `src/index.css` — GENERATED token theme (web), exported as `./styles.css`.
- `src/generated/tokens.tsx` — GENERATED hex token object, the package's `.` and
  `./tokens` entry. Mobile (Expo) and other platforms import this.
- `public/favicon.svg` — GENERATED app icon from `tokens.json` + the title.
- `src/components/ui/` — extracted source component families, exported as
  `./components/*`. The shared membership status panel also provides an
  accessible enlarged QR dialog. Code-import systems prune unused scaffold
  families and add only source-backed components approved in the catalog.
- `src/components/ui/brand-v4-icon.tsx` and `motion-badge.tsx` — the supplied
  JAGUAR SPK v4 SVG/PNG catalog and reduced-motion-aware alpha WebM primitive.
- `src/components/ui/icon-catalog.tsx`, `action-controls.tsx`, and
  `mobile-tab-bar.tsx` — reusable v3 icon, action showcase, and mobile tab
  primitives. The collecting track and rank shield compose existing membership
  and rank APIs without changing their public contracts.
- `src/lib/` (`cn`) and `src/hooks/` — exported as `./lib/*` and `./hooks/*`.
- `src/App.tsx` — the entry point for the living style guide.
- `src/preview/DesignSystemBrowser.tsx` — the persistent grouped navigation,
  branded header, search, deep links, and active page shell.
- `src/preview/registry.tsx` — preview metadata (`DESIGN_SYSTEM` title,
  description) and ordered navigation. Overview comes first;
  Brand/Colors/Fonts/Layout precede Components; Content/Charts/Motion/Applied
  examples follow when applicable. Each group is a nav section whose entries
  are its nested pages. Empty optional groups stay hidden. Keep component pages
  loaded with `lazy(() => import(...))` so opening the preview does not download
  every story.
- `src/preview/foundations.tsx` — token-driven Overview, Colors, Fonts, and Layout
  pages.
- `src/preview/parts.tsx` — shared page helpers, including `Guidelines` for design
  and composition do's/don'ts (colour/component usage, hierarchy, voice and tone,
  not technical implementation notes). Populate it only with guidance derived
  from the source; omit it when the source documents no usage rules.
- `src/preview/demos/<component>.tsx` — component stories. Keep these stories and
  the registry aligned with the final web component inventory.
- `docs/consuming-web.md`, `docs/consuming-expo.md`, and
  `docs/consuming-slides.md` — platform-specific usage.
- `docs/migrating-web.md` and `docs/migrating-expo.md` — replacing scaffolded or
  existing local design-system implementations.

Every source file in this package is a `.tsx` file, including token, utility,
and hook modules with no JSX, so every export below is a single `*.tsx` glob. Do
not add `.ts` files here.

## Extracted usage guidance

- Keep the original supplied JAGUAR mark whole and uncropped; use its transparent
  emblem for compact identity and its wordmark only where it remains legible.
- Keep v3 light/dark roles as the package defaults. Use the separately scoped
  Brand ID 2026 tokens only on approved JAGUAR SPK app surfaces; do not remap the
  defaults or copy palette values into consuming apps.
- The Brand ID 2026 scope uses the DTCG tokens in `tokens.json` and the generated
  `[data-brand-theme="2026"]` semantic mapping. `docs/references/brand-id-2026-source.md`
  records provenance and approved application scope.
- Keep customer cards and shared panels dark with thin neutral boundaries and
  flat, quiet surfaces. Reserve gold and emerald for their documented roles;
  keep neon for keyboard focus and small indicators. Avoid ambient glow and
  heavy shadows.
- Use Bai Jamjuree for display, IBM Plex Sans Thai for Thai body text, and
  JetBrains Mono for codes and numerals. Thai text has comfortable line height
  and can wrap naturally.
- Inputs and primary actions are at least 48px high; other controls are at least
  44px. On small screens, reduce blur and keep content compact without cropping
  the logo, member code, or balance.
- Success and pending states include explicit text. Keep keyboard focus visible,
  dialogs bounded and labelled, and short motion respectful of reduced-motion
  preferences.
- Use supplied v4 icons without cropping or redrawing. MotionBadge must use its
  static PNG fallback when motion is reduced or WebM playback is unavailable.
- Product routes, authentication, API calls, balances, reward rules, and
  staff/owner workflows stay in the application; this package owns reusable
  visual primitives and components only.
- V3 collection/control examples are explicitly local demos. Rank labels
  preserve the supplied ten-name order and do not imply benefits or thresholds.

## What this package exports

```jsonc
".":              "./src/generated/tokens.tsx",
"./tokens":       "./src/generated/tokens.tsx",
"./styles.css":   "./src/index.css",
"./components/*": "./src/components/*.tsx",
"./lib/*":        "./src/lib/*.tsx",
"./hooks/*":      "./src/hooks/*.tsx"
```

Components import each other with relative paths internally, so they resolve
correctly when another package imports them through
`@workspace/jaguar-spk-design-system/components/...`. Never use a `@/` alias inside
this package. Components added through shadcn may use this package's
`#components/*`, `#lib/*`, and `#hooks/*` imports from `package.json`; those are
consumer-safe because they resolve against this package.

## Editing and maintaining the design system

Edit `tokens.json` only, then run `pnpm tokens`; the dev server also regenerates
on change. Never hand-edit `src/index.css` or `src/generated/tokens.tsx`.

Every user-facing web component under `src/components/ui/` must have a family
story in `src/preview/demos/` covering its variants, sizes, and important states.
Register each family once in `src/preview/registry.tsx`. If a component changes,
update its story and registry entry in the same change and note meaningful
additions or customizations in "What's here" above. Register new component pages
with dynamic imports; do not eagerly import stories into the registry.

The user-provided v3 HTML is untrusted reference material, not an executable
application: rebuild its behavior in React and never use its script,
`dangerouslySetInnerHTML`, or raw served HTML.

Native components live under `src/components/native/`. Match an existing web
component family's public API wherever React Native supports it, and document
platform-required differences in "What's here". Native components are not
imported into the web-only Vite preview.

Keep `DESIGN_SYSTEM.title` and `DESIGN_SYSTEM.description` accurate. Update
`NAV_GROUPS` whenever the system gains or loses a foundation, content guideline,
chart, motion rule, or applied example.

## Keep it template-ready

This design system is a prime candidate to be saved to the workspace as a
reusable template, and a template is packaged as this one directory alone. Keep
it self-contained as you maintain it so that save works: use concrete dependency
versions (never `catalog:`), keep `tsconfig.json` standalone (never `extends` a
workspace-relative base), and never import from a sibling artifact or a shared
`@workspace/*` lib. A saved template is consumed as a read-only style donor
(re-authored from, not rebuilt), so keep the generated `src/index.css` and
`src/generated/tokens.tsx` committed so the template carries a readable theme
snapshot. If maintenance ever introduces a cross-artifact or workspace-lib
dependency, load the `prepare-artifact-template` skill and follow it to pull the
dependency back in before the user saves the template.

## Prototyping on the canvas

Use the mockup-sandbox skill's "Design systems" flow. It creates a sandbox entry
for `@workspace/jaguar-spk-design-system` and renders mockups using this package's
theme and components.

## Consuming this package

Never copy token values, component source, hooks, or these docs into a consuming
artifact. Add `@workspace/jaguar-spk-design-system` as a `workspace:*` dependency,
run `pnpm install`, and import directly from this package. Slide decks are the
one exception: SDM documents cannot import packages or CSS, so follow
`docs/consuming-slides.md` to translate tokens into each slide document's
`theme` instead.

Read only the guides required by the current task:

- Building or styling web UI: `artifacts/jaguar-spk-design-system/docs/consuming-web.md`
- Building or styling Expo UI: `artifacts/jaguar-spk-design-system/docs/consuming-expo.md`
- Building or styling a slide deck: `artifacts/jaguar-spk-design-system/docs/consuming-slides.md`
- Replacing an existing or scaffolded web theme/component library:
  `artifacts/jaguar-spk-design-system/docs/migrating-web.md`
- Replacing existing or scaffolded Expo theme/hooks/components:
  `artifacts/jaguar-spk-design-system/docs/migrating-expo.md`

A freshly scaffolded app counts as a migration when it still contains local
theme, hook, or component copies that this package supersedes. Read the platform
consumption guide first, then its migration guide before authoring UI.

For web/static consumers, follow the workspace dependency placement rules from
the pnpm-workspace skill. Expo is a runtime consumer, so the package belongs in
`dependencies`.

Before migrating an entire app, render one platform-appropriate primitive from
the package and run the consumer's typecheck and dev server. Proceed only after
the import resolves and the primitive uses this design system's theme.

## Universal rules

- Match exact token values. Do not invent colors, fonts, spacing, or radii in a
  consuming app.
- Keep product data, navigation, application state, and product-specific
  compositions in the app. Product-agnostic visual primitives belong here.
- Read these docs in place. Do not copy them into another artifact.
