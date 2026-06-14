# Changelog

All notable changes to the 1Platform API Developer Docs will be documented in this file.

## [Unreleased]

### Added
- **AdClicker Integration flow** (`flows/adclicker-integration`) — End-to-end integration guide for the AdClicker traffic engine, covering all four contracts: (1) the **SSO / exchange** call `POST /v2/sso/exchange` (server-to-server with `x-access-api-key`, idempotent upsert by `{email, source}`, returns the AdClicker JWT); (2) the **Campaigns** contract — full advertiser CRUD (`GET/POST/PUT/DELETE /v2/users/:userId/campaigns`, stats, wallet), internal-traffic campaigns under `/v2/apps/1platform/campaigns`, the `Campaign` data model, and the `draft → onreview → active → paused/exhausted → done` state machine; (3) the **composed shortener** endpoint `GET /v2/apps/:appId/settings/shortener` (response shape frozen — legacy `exchangeSettings` ⊕ active campaigns, `internal` prioritized, country/schedule/budget filtered); (4) the **analytics webhook** `POST /api/v1/webhooks/adclicker` (header `X-AdClicker-Signature: sha256=<hmac>` + `X-Idempotency-Key`, `200`/`401`/`409`, idempotent by idempotency key, HMAC keyed with `ADCLICKER_WEBHOOK_SECRET`). All AdClicker examples use the correct `x-access-token` / `x-access-api-key` headers and the `{code, valid, msg, data}` envelope. Provider names are kept generic on advertiser-facing surfaces (Wallet / Saldo) per the client-facing compliance rule. Registered in the **Flows** sidebar category and added as a homepage quick-link card.

### Changed
- **Solutions navbar item** converted from a single link to a Docusaurus `type: 'dropdown'` so the developer-docs navbar mirrors the website's new hybrid Solutions dropdown. Dropdown items (in order): Online Store, Website Builder, AI Content, Whitelabel Dashboard, Payments & Invoicing, View all solutions. All targets `_self` and point at `https://1platform.pro/...`. Parent `href` keeps Solutions itself navigable to `/solutions/`. Item list documented as source of truth in `CLAUDE.md` Navbar contract and paired with the website's `Header.astro` `solutionsSubItems` array.
- **`webhooks/configuring-urls`**: Update the example webhook receiver from `api.bowerbird.pro` to `api.bowerfans.com` to match the customer's settled product domain. Documentation example only — no contract change

## [0.18.0] - 2026-04-29

### Added
- **Webhook Integration section (6 new pages)** — Dedicated category covering the outbound webhook contract from end to end:
  - `webhooks/overview` — Mermaid sequence diagram of the buyer → merchant → 1Platform → upstream → merchant flow plus the canonical event list (`on_approved`, `on_denied`, `on_cancelled`, `on_expired`, `on_dismiss`)
  - `webhooks/security` — HMAC-SHA256 signing scheme: `X-Webhook-Signature: sha256=<hex>` + `X-Webhook-Timestamp` (epoch seconds), 5-minute replay window, body canonicalization rules, and verification snippets in Python / TypeScript / PHP. Includes a `:::danger` callout that secret rotation is irreversible
  - `webhooks/receiving-notifications` — Canonical outbound payload schema with the dual-currency contract (`amount` in provider currency vs `merchant_amount` for ledgering), echoed `metadata` and `merchant_reference`, and the FSM table for inbound statuses
  - `webhooks/configuring-urls` — How to register allowed domains, declare per-event handler URLs, remove domains, and rotate the signing secret
  - `webhooks/retry-and-delivery` — At-least-once delivery semantics, backoff schedule, dead-letter behaviour, and merchant idempotency requirements (`transaction_id + event`)
  - `webhooks/code-samples` — Multi-language verification + dispatch examples in Python (`httpx` + `hmac`), TypeScript/Node (`fetch` + `node:crypto`), PHP (`cURL` + `hash_hmac`)
- **Reference section (7 new pages)** — Canonical lookup tables that previously lived only in flow walkthroughs:
  - `reference/environments` — Production vs QA base URLs, key scoping rules, and runtime environment discovery via `GET /health` `data.environment`
  - `reference/glossary` — Authoritative names for every identifier in the API (`transaction_id`, `external_transaction_id`, `merchant_reference`, `metadata`, `payment_gateway_id`, `app_token`, `user_token`, `webhook_secret`) with deprecation note on `externalId`
  - `reference/error-codes` — Unified catalogue of every machine-readable `data.code` value (`PAYMENT_GATEWAY_NOT_CONFIGURED`, `CURRENCY_NOT_SUPPORTED`, `PAYMENT_PROVIDER_TIMEOUT`, `REFUND_NOT_SUPPORTED`, `DOMAIN_ALREADY_REGISTERED`, `URL_HOST_NOT_ALLOWED`) with HTTP status, meaning, and recommended client behaviour
  - `reference/rate-limits` — All `*_LIMIT` constants from `app/core/rate_limit.py` plus the SHA-256 key derivation rule
  - `reference/troubleshooting` — Catalogue of non-obvious failure modes (502 with HTML, 401-on-every-call, webhook signature mismatches) with concrete fixes
  - `reference/testing` — Sandbox tenant guidance, test card numbers, and webhook replay with `ngrok` / `smee`
  - `reference/response-format` — The two response wrappers (client-facing `{success, data, msg}` vs inbound webhook `{status, message}`) and how outbound webhooks are domain-specific

### Changed
- **`flows/payments-and-subscriptions`**: Step 3 rewritten with a `:::warning` prerequisite callout citing 422 / `PAYMENT_GATEWAY_NOT_CONFIGURED`; new explanation of `usd_amount` (merchant currency) vs `amount` (provider currency) vs `currency_provider`; new Refund section documenting the 501 stub; added Token Caching tip in Step 0/1; added Idempotency note in Step 3 recommending `merchant_reference` for reconciliation; added FSM table summarising inbound transaction statuses
- **Sidebar**: Added two new top-level categories — **Webhook Integration** (above Reference) and **Reference** (above Flows). Existing flows category and ordering unchanged
- **Theme**: Forced light mode permanently (`darkMode: false`, `forceDarkModeState: 'light'`, `hideDarkModeToggle: true`, navbar `colorMode.disableSwitch: true`) to match the 1Platform Design System and remove a UI toggle that contradicted the documented "light by default" policy

## [0.17.0] - 2026-04-27

### Added
- **Dashboard Overview flow** — End-to-end flow for bootstrapping a whitelabel dashboard via `GET /dashboard/bootstrap` (branding, theme, layout, modules, feature flags), `GET /dashboard/i18n` and `GET /dashboard/i18n/{lang}` for localized strings (with 304 Not Modified caching), and `GET /dashboard/summary` for home KPIs (balance, unread notifications, resource counters)
- **Dashboard Settings flow** — CRUD on app-level key/value settings: list (`GET /settings`), upsert (`PUT /settings`), read by key (`GET /settings/{key}`), and delete (`DELETE /settings/{key}`). `PUT` is idempotent for safe retries
- **Magic Link Authentication flow** — Passwordless email auth: request a magic link, exchange the single-use token for an access + refresh token pair (`POST /auth/user/magic-link/verify`), rotate refresh tokens (`POST /auth/user/refresh`), and revoke sessions (`POST /auth/user/logout`)
- **Notifications flow** — In-app notification feed with severity (`info`, `success`, `warning`), per-user or global broadcast targeting (`POST /notifications`), mark-as-read (`PATCH /notifications/{id}/read`), and a dedicated unread-count endpoint for navbar badges
- **Referrals flow** — Resolve a referral code to its destination payload (`code`, `valid`, `referrer_username`, `signup_url`) via `GET /referrals/{code}` for public landing pages
- **Support flow** — Embed a help center: list and create tickets with priority and status, append threaded user/agent replies (`POST /support/tickets/{id}/reply`), and serve a public FAQ catalog (with admin-only publishing)
- **Tasks flow** — Personal task list with `todo` / `in_progress` / `done` lifecycle, optional due dates, and automatic `completed_at` tracking when status moves to `done`
- **Webhook Configuration flow** — Configure outbound webhooks: register allowed domains (returns the initial signing secret), declare per-event handler URLs (`on_approved`, `on_denied`, `on_cancelled`, `on_expired`, `on_dismiss`), remove domains, and rotate the HMAC signing secret
- **List Plans step in Payments & Subscriptions flow** — Documents the new `GET /api/v1/plans` endpoint for enumerating active billing plans (`free`, `payg`, `subscription`) before initiating an upgrade

### Changed
- **Sidebar**: Added 8 new flow entries (alphabetical from position 14 onward); kept `generate-invoice` at position 1 and `user-onboarding` at position 2 per the canonical ordering
- **Homepage**: Added 8 new flow cards to the `quickLinks` array, reordered all flow cards by `sidebar_position` for visual alignment with the sidebar; total now 21 flows + API Reference + OpenAPI Spec
- **Payments & Subscriptions flow**: Renumbered consumption steps (history → 7, summary → 8) to accommodate the new "List Available Plans" step at position 6

## [0.14.0] - 2026-04-07

### Added
- **402 error codes**: Added `402 Insufficient balance` error responses to AI generations (comments, images, profiles), content generation, keyword research, indexing, Search Console, legal pages, and link-building endpoints
- **422 error codes**: Added missing `422 Validation error` responses to user onboarding, website management, and Search Console endpoints
- **Homepage quick links**: Added Google AdSense and Domain Management flow cards to the developer docs homepage
- **Link-building tip**: Added admonition documenting all marketplace actions (`orders`, `sync`, `accept_order`, etc.)

### Changed
- **Image provider values**: Changed `"pixabay"`/`"pexels"` to `"default"`/`"alternative"` in all content generation examples and validations
- **Keyword response field**: Renamed `domain` to `lookup_key` in keyword-by-domain response to match API
- **Topic keyword response**: Updated response example with fuller structure (`total`, `categories`, `country`, `title`, `url` fields)
- **Analytics response**: Added `"data": null` to MP event, disconnect, and deprovision responses
- **Website duplicate error**: Changed from `400` to `409` for duplicate website creation
- **User onboarding**: Added `401` error for invalid app token on user creation
- **OpenAPI spec**: Updated `ReportPeriod` schema references — Analytics uses `ReportPeriod` (with `12m`), AdSense uses `app__models__adsense__ReportPeriod` (without `12m`)

## [0.12.0] - 2026-04-06

### Added
- **Generate Invoice flow**: Added Step 2d — person lookup by CUI/DPI (`POST /api/v1/identify`) for pre-filling invoice receptor data
- **AI Agents flow**: Added Step 8b — get agent by ID (`GET /agents/{agent_id}`) and Step 11b — get action by ID (`GET /agent-actions/{action_id}`)

### Changed
- **Sidebar**: Cleaned up duplicate flow entries after upstream merge

## [0.10.0] - 2026-04-06

### Added

- **Google AdSense flow** (`docs/flows/google-adsense.mdx`) — 17-step guide covering the full AdSense integration: OAuth authorization, account connection, site management, earnings overview/by-page/custom reports, alerts, policy issues, disconnect, and repair.
- **Domain Management flow** (`docs/flows/domain-management.mdx`) — 17-step guide covering domain registration, DNS record management, nameserver configuration, WHOIS privacy, domain transfers, renewals, registrar locks, and operations history.
- **Consumption tracking** in Payments & Subscriptions flow — Step 6 (`GET /users/consumption`) for paginated consumption history and Step 7 (`GET /users/consumption/summary`) for aggregated cost breakdowns by operation type.
- Homepage cards for Google AdSense and Domain Management flows.

### Changed

- Updated `sidebars.ts` to include `google-adsense` and `domain-management` entries.
- Updated `payments-and-subscriptions.mdx` description, overview, end-to-end example, quick reference, and checklist with consumption endpoints.
- Refreshed OpenAPI spec from Production API.

## [0.8.0] - 2026-03-28

### Added

- **Google Analytics flow** (`docs/flows/google-analytics.mdx`) — 18-step guide covering the full GA4 integration lifecycle: OAuth authorization, property provisioning, tracking tag installation, custom dimensions, key events, site overview/realtime/per-page metrics, Measurement Protocol events, disconnect, and deprovision.
- **Revoke tokens step** in User Onboarding flow — Step 4 (`POST /users/revoke-tokens`) for invalidating all user JWT tokens.
- **Keywords by topic step** in Generate AI Content flow — Step 2b (`POST /posts/keywords/topic/`) for discovering SEO keywords by topic instead of domain.
- Homepage card for Google Analytics flow in `quickLinks` array.

### Changed

- Updated `sidebars.ts` to include `google-analytics` entry.
- Updated `generate-ai-content.mdx` quick endpoint reference and checklist with keywords/topic.
- Updated `user-onboarding.mdx` quick endpoint reference, checklist, and end-to-end example with token revocation.
- Refreshed OpenAPI spec from Production API (PRODv1.7.2 — includes 18 new Analytics endpoints).

## [0.6.0] - 2026-03-21

### Added

- **AI Agents flow** (`docs/flows/ai-agents.mdx`) — 19-step guide covering the full agent lifecycle: catalog browsing, wizard-based creation, direct API creation, run execution, human-in-the-loop actions, metrics, and CRUD operations.
- **Activity Logs flow** (`docs/flows/activity-logs.mdx`) — 6-step guide for listing, inspecting, registering client-side events, and clearing API activity logs.
- **Branch management** in Generate Invoice flow — Steps 2b (Create Branch) and 2c (Get Branch Details) for multi-establishment businesses using TribuTax.
- Homepage cards for Activity Logs and AI Agents in `quickLinks` array.

### Changed

- Updated `sidebars.ts` to include `activity-logs` and `ai-agents` entries.
- Updated homepage `quickLinks` — AI Generations icon changed from robot to masks to avoid conflict with AI Agents.
- Updated `generate-invoice.mdx` quick endpoint reference table with branch endpoints.
- Updated `generate-invoice.mdx` unimplemented endpoints section (split Business/Branch update items, added List Branches).

## [0.5.3] - 2026-03-19

### Changed

- Bumped version (patch).
- Updated OpenAPI spec from Production API.

## [0.5.0] - 2026-03-13

### Added

- Minor version bump.

## [0.3.0] - 2026-03-07

### Added

- 6 new integration flows: User Onboarding, AI Generations, External Integrations, Generate AI Content, Manage Websites, Payments & Subscriptions.
