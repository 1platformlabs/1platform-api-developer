# CLAUDE.md — 1Platform API Developer Docs

This file provides project-specific guidance for the **API developer documentation site** (`developer.1platform.pro`).
See the root `../CLAUDE.md` for shared brand/API context.

## Project Overview

Interactive API documentation site for **1Platform** developers. Features an OpenAPI-powered API reference (Scalar), step-by-step integration flows, and code examples. The full specification is in `../DOCUMENTATION_PROMPT.md`.

## Tech Stack

- **[Docusaurus](https://docusaurus.io/) 3.9** — static documentation site generator
- **React 19** — for interactive components and custom pages
- **TypeScript 5.6** — type-safe configuration and components
- **[@scalar/docusaurus](https://github.com/scalar/scalar)** — interactive API reference from OpenAPI spec
- **MDX** — enhanced Markdown with React components for documentation
- **Prism** — syntax highlighting (GitHub light default, Dracula dark)
- **Package manager:** pnpm
- **Node version:** 24 (see `.nvmrc`)
- **Output:** `build/` folder with pure static HTML/CSS/JS

## Development

```bash
npm run start            # Dev server → http://localhost:3001 (hot reload)
npm run build            # Production build → build/ (runs fetch-openapi first)
npm run preview          # Preview built output locally
npm run fetch-openapi    # Download OpenAPI spec manually
npm run typecheck        # TypeScript type checking
npm run clear            # Clear Docusaurus cache
```

## Folder Structure

```
1platform-api-developer/
├── docs/                        # Source documentation (MDX/Markdown)
│   └── flows/                   # 9 integration flow guides (~5,800 lines MDX)
│       ├── generate-invoice.mdx     # FEL invoicing flow
│       ├── user-onboarding.mdx      # User registration & auth
│       ├── activity-logs.mdx        # API logging
│       ├── ai-agents.mdx            # Agent lifecycle & execution
│       ├── ai-generations.mdx       # AI comments, images, profiles
│       ├── external-integrations.mdx # GSC, link building
│       ├── generate-ai-content.mdx  # Keywords, content, indexing
│       ├── manage-websites.mdx      # Website CRUD, legal pages
│       └── payments-and-subscriptions.mdx # Billing & subscriptions
├── scripts/
│   └── fetch-openapi.mjs        # Downloads OpenAPI spec at build time
├── src/
│   ├── css/
│   │   └── custom.css           # Global styles (dark-first, harmonized with 1platform.pro)
│   ├── pages/
│   │   ├── index.tsx            # Homepage (React component)
│   │   └── index.module.css     # Homepage styles
│   └── theme/
│       └── Logo/
│           ├── index.tsx        # Custom logo component ("1Platform")
│           └── styles.module.css
├── static/
│   ├── img/                     # Images (logo, favicon, social card)
│   └── openapi.json             # Downloaded OpenAPI spec (generated at build time)
├── docusaurus.config.ts         # Main Docusaurus configuration
├── sidebars.ts                  # Sidebar navigation definition
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript config (editor only)
```

## Key Configuration

### docusaurus.config.ts

- **Site URL:** `https://developer.1platform.pro`
- **API Reference route:** `/api-docs` (Scalar plugin)
- **OpenAPI spec:** Served from `/openapi.json` (local static copy to avoid CORS)
- **Scalar proxy:** `https://proxy.scalar.com` (for browser API testing)
- **Blog:** Disabled
- **i18n:** English only

### OpenAPI Spec Pipeline

1. `prebuild` script runs `node scripts/fetch-openapi.mjs`
2. Fetches from `https://api.1platform.pro/openapi.json` (override with `OPENAPI_URL` env var)
3. Injects server info (Production + QA URLs)
4. Saves to `static/openapi.json`

### Sidebar Structure (9 Integration Flows)

```ts
// sidebars.ts
docs: [
  { type: 'category', label: 'Flows', items: [
    'flows/generate-invoice',        // FEL invoicing (TribuTax)
    'flows/user-onboarding',         // User registration & auth
    'flows/activity-logs',           // API logging and event tracking
    'flows/ai-agents',               // Agent lifecycle, catalog, runs
    'flows/ai-generations',          // AI comments, images, profiles
    'flows/external-integrations',   // Google Search Console, link building
    'flows/generate-ai-content',     // Keywords, content generation, indexing
    'flows/manage-websites',         // Website CRUD, legal pages
    'flows/payments-and-subscriptions' // Billing, transactions, subscriptions
  ]}
]
```

## Design System (harmonized with 1platform.pro)

**IMPORTANT:** This site uses a **light theme by default** to visually differentiate it as technical documentation from the dark-themed marketing website (`1platform.pro`). Shared accent color (#2563eb) and typography (Inter + JetBrains Mono) maintain brand consistency.

- **Light mode by default:** `color-scheme: light`, respects `prefers-color-scheme`
- **Background:** `#ffffff` (white), surfaces: `#f8fafc`, elevated: `#f1f5f9`
- **Accent:** `#2563eb` (blue), hover: `#1d4ed8`, glow: `rgba(37, 99, 235, 0.08)`
- **Text:** `#0f172a` (primary), `#64748b` (secondary), `#94a3b8` (tertiary)
- **Borders:** `#e2e8f0` — clean, professional
- **Typography:** Inter (sans-serif, 400-700) + JetBrains Mono (monospace, 400-500)
- **Border radius:** 8px (standard), 12px (large)
- **Code blocks:** Rounded corners (12px), GitHub syntax theme (light), Dracula (dark)
- **Cross-project nav:** Navbar includes link back to `1platform.pro`
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (same ease-out-expo as website)

### Dark Mode (toggle available)

Dark mode is available via toggle and respects system preference. Uses `#0a0a0a` bg with `#3b82f6` accent (matching marketing website).

## Content Guidelines

### Integration Flows (docs/flows/)

Each flow document should follow this structure:
1. **Title & description** in frontmatter
2. **Overview** — what the flow achieves, use case, end result
3. **Prerequisites** — required tokens, configurations, prior setup
4. **Variables** — bash variables used in examples
5. **Step-by-step** — numbered steps with:
   - HTTP method + endpoint
   - cURL example with request body
   - Full response example
   - Notes on response fields
6. **Error handling** — common errors and how to handle them
7. **Best practices** — idempotency, retries, timeouts
8. **End-to-end example** — complete script combining all steps

### Code Examples

- Use `bash` / `json` / `javascript` language tags for syntax highlighting
- Include full request/response pairs (not just snippets)
- Use variables (`$BASE_URL`, `$APP_TOKEN`) for reusable examples
- Always show both the request and the expected response

### Provider Names in Docs

Unlike the marketing website, provider names (e.g., TribuTax) MAY appear in API developer documentation where technically necessary to explain integration behavior. However, prefer describing capabilities generically when possible.

## CI/CD Pipeline (`.github/workflows/prod.yml`)

Automated production deployment with 6 sequential jobs:

1. **update_spec** — Fetches latest OpenAPI spec from production API, commits if changed
2. **build** — Node 24, pnpm install, npm run build, uploads artifact
3. **version_bump** — AI-powered semver determination (Claude Sonnet), updates package.json, commits
4. **release** — Creates git tag + GitHub Release with build artifact
5. **deploy** — Atomic rsync to Hetzner server, health check (10 attempts)
6. **notify** — Slack notifications for failures/success

**Triggers:** `workflow_dispatch`, `repository_dispatch` (from API repo deploy), `push` to `main`

## Version

Current version: **0.7.4** (auto-bumped by CI/CD pipeline)

## Restrictions (NEVER)

- Never hardcode API tokens or real credentials in examples — always use placeholders
- Never skip heading levels (H1 → H3 without H2)
- Never leave incomplete code examples — always show full request + response
- Never reference internal implementation details that could change without notice
- Never use `transition: all` — list specific properties in CSS

## Verification (after implementation)

```bash
npm run build            # Must succeed, zero errors
npm run preview          # Visual review all pages
# Test Scalar API reference loads and displays endpoints
# Test all code examples are syntactically valid
# Verify light/dark mode toggle works correctly
# Check sidebar navigation for correct hierarchy
```
