# Changelog

All notable changes to the 1Platform API Developer Docs will be documented in this file.

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
