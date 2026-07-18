# CLAUDE.md — 1Platform API Developer Docs

This file provides project-specific guidance for the **API developer documentation site** (`developer.1platform.pro`).
See the root `../CLAUDE.md` for shared brand/API context.

> Everything below is meant to be checkable. If a statement here disagrees with
> the code, the code wins and this file is the bug — a memory that describes a
> system that no longer exists is worse than no memory at all.

## Project Overview

Documentation portal for **1Platform**: operator guides for the configurable
end-products, developer docs for the SaaS APIs, and two interactive OpenAPI
references (Scalar). The full specification is in `../DOCUMENTATION_PROMPT.md`.

## Tech Stack

- **[Docusaurus](https://docusaurus.io/) 3.9** — static documentation site generator
- **React 19** — swizzled theme components
- **TypeScript 5.6** — type-safe configuration and components
- **[@scalar/docusaurus](https://github.com/scalar/scalar)** — interactive API reference, one instance per API
- **MDX** — enhanced Markdown with React components
- **Prism** — syntax highlighting (GitHub light)
- **Package manager:** pnpm, pinned via `packageManager` in `package.json`
- **Node version:** 24 (see `.nvmrc`)
- **Output:** `build/` folder with pure static HTML/CSS/JS

## Development

```bash
pnpm start            # Dev server → http://localhost:3001 (hot reload)
pnpm build            # Provider-leak gate, then production build → build/
pnpm serve            # Serve the built output locally (port 3001)
pnpm fetch-openapi    # Download the OpenAPI specs manually
pnpm typecheck        # TypeScript type checking (tsc)
pnpm check:tells      # Design-system guard (see "Gates")
pnpm check:compliance # Provider-leak gate on its own
pnpm clear            # Clear Docusaurus cache
```

`build` does NOT fetch the OpenAPI specs. The committed copies under
`static/openapi/` are what gets built; refreshing them is a CI step (or a manual
`pnpm fetch-openapi`).

## Folder Structure

```
1platform-api-developer/
├── docs/
│   ├── intro.mdx                     # Landing page (renders the HomeCards grids)
│   ├── products/                     # Group A — per-tenant operator docs
│   │   ├── dashboard/                #   each with _category_.json carrying
│   │   ├── atlas-dashboard/          #   customProps.{icon,description}
│   │   └── atlas-app/
│   └── saas/                         # Group B — developer docs
│       ├── 1platform-api/
│       │   ├── flows/                #   23 integration flow guides
│       │   ├── reference/
│       │   └── webhooks/
│       └── atlas-api/
├── i18n/es/code.json                 # theme.* UI strings ONLY (see i18n below)
├── scripts/
│   ├── fetch-openapi.mjs             # Downloads both specs (multi-spec)
│   ├── check-provider-leak.mjs       # Compliance gate, runs inside `build`
│   └── check-tells.sh                # Design-system guard
├── src/
│   ├── components/
│   │   ├── Icon/{index.tsx,icons.ts} # The icon registry — single source
│   │   └── HomeCards/                # Landing card grids
│   ├── css/custom.css                # Token layer + all theming
│   ├── pages/index.tsx               # Redirect: / → /docs/
│   └── theme/                        # Exactly three swizzles
│       ├── Logo/
│       ├── Footer/
│       └── DocSidebarItem/Category/
├── static/
│   ├── fonts/                        # 6 woff2 + 3 OFL licences (self-hosted)
│   ├── img/
│   └── openapi/<id>.json             # Committed spec cache, one per API
├── docusaurus.config.ts
├── sidebars.ts
└── tsconfig.json
```

## Key Configuration

### docusaurus.config.ts

- **Site URL:** `https://developer.1platform.pro`
- **Broken links:** `onBrokenLinks: 'throw'` — a bad internal link fails the build.
- **API reference routes:** `/api-reference/1platform-api` and
  `/api-reference/atlas-api`, one Scalar instance each (unique `id` required).
  `/api-docs` redirects to the first for backward compatibility.
- **OpenAPI specs:** served from `/openapi/<id>.json` (committed static copies,
  avoiding CORS).
- **Scalar proxy:** `https://proxy.scalar.com` (for in-browser API testing)
- **Blog:** disabled
- **Colour mode:** light only — `disableSwitch: true`,
  `respectPrefersColorScheme: false`. There is no dark theme and the stylesheet
  contains no dark CSS.
- **i18n:** Spanish only (`defaultLocale: 'es'`, `locales: ['es']`). Spanish is
  the **canonical source** of the docs. Single locale ⇒ no locale switcher.

**The portal is in Spanish; `1platform.pro` is in English.** This is a known,
deliberate discontinuity, not an oversight — unifying the language is a content
decision over ~96 pages and is explicitly out of scope for the design work.
Do not "fix" it by translating one side in passing.

### OpenAPI spec pipeline

1. `scripts/fetch-openapi.mjs` fetches BOTH specs. It is run by CI
   (`update_spec`), never by `build`.
2. Source URLs are overridable per API: `ONEP_API_OPENAPI_URL` and
   `ATLAS_API_OPENAPI_URL`.
3. Server info is injected (Production + QA URLs).
4. Results are written to `static/openapi/<id>.json` and committed as cache.

### Sidebar structure

Two audience groups, defined in `sidebars.ts` with Spanish labels
(`Productos (por tenant)`, `SaaS y API`), each containing **autogenerated**
categories. A product's label, icon and description live in its
`_category_.json` under `customProps`; each section's `index.mdx` acts as the
category index page. Do not hardcode the document list here.

## Design System

The portal shares **one** design system with `1platform.pro`. It is not a
sibling palette or a "docs variant" — the same tokens, the same three
typefaces, the same logo. A visitor clicking "Docs" on the marketing site should
not be able to tell they changed origin.

### Where a decision lives

All of it in `src/css/custom.css`, in this order: primitives → semantic
aliases → `--ifm-*` mapping → `--scalar-*` mapping. **Nothing else decides a
colour.** `--ifm-*` variables are mapped onto tokens, never replaced, so a
Docusaurus upgrade that adds a variable keeps working.

### Tokens

- **Primitives:** `--ink #14161B`, `--paper #F6F5F2`, `--surface #FFFFFF`,
  `--recessed #EFEEEA`, `--cobalt #1F4FE0`, `--cobalt-deep #1A44C4`,
  `--cobalt-wash #ECF0FD`, `--signal #F5A524`, `--muted #5B5F6B`,
  `--subtle #656974`, `--hairline`, `--hairline-strong`.
- **One accent** (cobalt). **One signal** (amber), reserved for graphics —
  `--signal` measures 1.87:1 on paper and must NEVER carry text.
- **Status colours are functional only** (success / danger / warning). There is
  no decorative hue; the purple/cyan/green/orange ramp was removed.
- **Contrast is verified on the WORST surface a token can land on**, not the one
  it happens to sit on. Current worst-case ratios: ink 15.59, muted 5.49,
  subtle 4.73, cobalt 5.56 — all on `--recessed`. `--subtle` is `#656974`
  precisely because the earlier `#696D79` cleared paper and surface but fell to
  4.45 on `--recessed`, which is where code-block headers sit.
- **Radius:** 6px standard, 10px large, 14px xl. **Easing:** `ease-out-expo`.

### Typography

Three self-hosted families, latin subsets, in `static/fonts/` with their OFL
licences: **Space Grotesk** (display/headings, 500/700), **Inter** (text,
400/500/600), **JetBrains Mono** (code and the eyebrow label, 400). Declared as
six `@font-face` rules; the two above-the-fold faces are preloaded via
`headTags`. There is no CDN font request anywhere in the repo — verifying "the
font loaded" means counting woff2 responses, not calling `document.fonts.check()`,
which returns true against a fallback.

### Icons

`src/components/Icon/icons.ts` is the single registry: 24×24, 1.5 stroke,
`currentColor`, `aria-hidden`. Paths are copied from
`1platform-website/src/components/icons.ts` so a concept is the same drawing on
both domains. Adding an icon means adding it there. An unknown name in a
`_category_.json` degrades to no icon rather than breaking the build.

### Never

- Never write a hex outside the `:root` token layer — including inside `rgba()`,
  which is how the retired blue survived several cleanups.
- Never use `var(--token, #fallback)`: a fallback silently renders off-system.
- Never use an emoji (or an HTML entity glyph) as an icon.
- Never identify a product by colour alone — no pastel tiles.
- Never use `transition: all`; list the properties.
- Never add a decorative gradient, `backdrop-filter`, or a hover lift.
- Never let a tap target fall below 44px.
- Never swizzle `Navbar`, `Layout` or `Root`. The native chrome supplies the
  keyboard, focus, landmark and mobile-drawer behaviour that a bespoke shell
  would have to reimplement; only its skin is ours.

## Content Guidelines

### Integration flows (`docs/saas/1platform-api/flows/`)

1. **Title & description** in frontmatter
2. **Overview** — what the flow achieves, use case, end result
3. **Prerequisites** — required tokens, configurations, prior setup
4. **Variables** — bash variables used in examples
5. **Step-by-step** — HTTP method + endpoint, cURL with body, full response, field notes
6. **Error handling** — common errors and how to handle them
7. **Best practices** — idempotency, retries, timeouts
8. **End-to-end example** — complete script combining all steps

### Code examples

- Use `bash` / `json` / `javascript` language tags
- Include full request/response pairs, not just snippets
- Use variables (`$BASE_URL`, `$APP_TOKEN`) for reusable examples

### Provider names

Group A (`docs/products/**`, client-facing, per tenant) must **never** name an
external provider — `scripts/check-provider-leak.mjs` enforces this inside
`pnpm build`. Group B (`docs/saas/**`) is deliberately exempt: naming a provider
is sometimes technically necessary there (e.g. TribuTax in the invoicing flow).
Prefer generic capability wording regardless.

## i18n — one source per string

Spanish is the only locale, so `i18n/es/code.json` is what actually renders.
That made it possible for a translation to silently override its own source, and
it happened: the landing cards' strings existed in both `code.json` and
`HomeCards/index.tsx`, and the two had drifted.

The rule now: **`code.json` holds `theme.*` UI strings only.** Content strings
live in the component that renders them. If a second locale is added, translate
via that locale's `code.json` and leave the source alone.

`navbar.json`, `current.json` and `footer.json` were removed: their keys were
derived from English labels that no longer exist (or, for the footer, from a
copyright the swizzle renders itself), so none of them could ever match.

## Gates

`.github/workflows/ci.yml` runs on every pull request and **blocks the merge**:
`pnpm build` (which includes the provider-leak gate and `onBrokenLinks:'throw'`),
`pnpm typecheck`, and `pnpm check:tells`.

`typecheck` matters more than it looks: `docusaurus build` transpiles TSX with
Babel and does **not** check types, so a type error in a swizzle would otherwise
compile green and deploy.

`scripts/check-tells.sh` guards the design system: emoji as icons, palette hex
outside the token layer (including rgba triplets), `var(--token,#fallback)`,
`transition:all`, decorative gradients, pastel tiles, backdrop-filter, hover
lifts, fonts actually embedded and preloaded, and provider names outside the
permitted paths. Every category has a matching entry in
`scripts/tells-fixtures/` proving it fails when the tell is present — a guard
nobody watched fail is not a guard.

## CI/CD Pipeline (`.github/workflows/prod.yml`)

Deployment only; it is not a PR gate. Six sequential jobs:

1. **update_spec** — fetches latest OpenAPI specs from production, commits if changed
2. **build** — Node 24, pnpm install, build, uploads artifact
3. **version_bump** — AI-assisted semver determination, updates package.json, commits
4. **release** — git tag + GitHub Release with the build artifact
5. **deploy** — atomic rsync to Hetzner, health check (10 attempts)
6. **notify** — Slack notifications

**Triggers:** `workflow_dispatch`, `repository_dispatch` (from the API repo
deploy), `push` to `main`.

⚠️ There is **no `paths-ignore`**: any push to `main`, including a
documentation-only or CI-only commit, runs the full pipeline through to
`deploy`. Merging a PR here deploys to production.

## Version

Auto-bumped by the pipeline; read `package.json` rather than trusting a number
written here.

## Navbar & Footer Harmony Rule (MUST)

The developer docs **navbar AND footer** **MUST mirror the marketing website** so
users experience a seamless transition between subdomains. Both chromes must
feel identical across domains — and since the design-system port, that now
includes the tokens, the three typefaces and the logo, not just the link lists.

**Source of truth on each side:**
- Website — `1platform-website/src/components/Header.astro` (navbar),
  `Footer.astro` (footer), `Logo.astro` (mark), `src/styles/global.css` (tokens)
- Developer docs — `docusaurus.config.ts` (navbar),
  `src/theme/Footer/` (footer), `src/theme/Logo/` (mark),
  `src/css/custom.css` (tokens)

**Labels differ by language and that is expected**: the website is English, this
portal is Spanish. The contract is about **order, destinations and structure**,
not about the literal strings.

**Navbar contract:**
- Item order: Solutions · Features · Pricing · Docs · Blog, then the CTA right-aligned.
  Here: Soluciones · Funciones · Precios · Documentación · Blog · "Comenzar gratis".
- Cross-subdomain links point at `https://1platform.pro/<page>/` with
  `target: '_self'`; the auto-appended external-link icon is hidden.
- **Solutions dropdown** — five items, a rule, then the catch-all, in this order:
  1. Online Store → `/solutions/online-store/`
  2. Website Builder → `/solutions/website/`
  3. AI Content → `/solutions/content/`
  4. Whitelabel Dashboard → `/solutions/whitelabel/`
  5. Payments & Invoicing → `/payments-invoicing/`
  6. *(divider)*
  7. View all solutions → `/solutions/`
- **Docs entry:** single link, no dropdown. Here it points to `/`.
- **CTA:** → `https://app.1platform.pro`, accent button, `min-height: 44px`.
- **Logo:** the "1" is a cobalt rounded-square node (1.32em, 0.26em radius),
  not blue text. Identical geometry on both sites.

**Footer contract:**
- **CTA banner:** headline + lead + two buttons. The headline carries **no
  count of tools replaced** — the site contradicted itself across 4/5/6/19+ and
  the agreed phrasing is unnumbered. Do not reintroduce a number.
- **Link grid:** brand column (logo + "One platform. Every solution." tagline)
  plus four columns in order — **Soluciones** (8 items), **Recursos** (5),
  **Empresa** (3), **Legal** (3).
- **Column titles** use the eyebrow voice: mono, uppercase, `0.14em` tracking.
- **Bottom row:** `© {year} 1Platform Labs. Todos los derechos reservados.`,
  rendered by the swizzle from the current year.
- **Grid:** `1.5fr repeat(4, 1fr)`, collapsing to 2 columns with the brand
  spanning the full row at ≤768px.

**If you add, remove, rename, or reorder a navbar item or footer column/link on
either site, you MUST update the other in the same commit.**

## Restrictions (NEVER)

- Never hardcode API tokens or real credentials in examples — always use placeholders
- Never skip heading levels (H1 → H3 without H2)
- Never leave incomplete code examples — always show full request + response
- Never reference internal implementation details that could change without notice
- Never modify `prod.yml` to trigger on pull requests — validation and
  deployment stay separate workflows

## Verification (after implementation)

```bash
pnpm typecheck        # zero errors
pnpm build            # zero errors; provider-leak gate and broken links pass
pnpm check:tells      # every category ok
pnpm serve            # then review in a browser:
# - both Scalar routes render on paper with the cobalt accent, no console errors
# - the header matches 1platform.pro side by side (background, height, logo, family)
# - six /fonts/*.woff2 responses return 200, and an h1 measures DIFFERENTLY
#   than the same h1 forced to system-ui (a font can be "declared" and absent)
# - no horizontal overflow from 320px to 2560px
# - with prefers-reduced-motion emulated, nothing animates and all content is visible
```
