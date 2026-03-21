# Changelog

All notable changes to the 1Platform API Developer Docs will be documented in this file.

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
