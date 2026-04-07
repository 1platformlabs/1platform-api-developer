# Changelog

All notable changes to the 1Platform API Developer Docs will be documented in this file.

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
