# Changelog

All notable changes to **1Platform API Developer Docs** will be documented in this file.

## [0.3.0] — 2026-03-18

### Added

- **User Onboarding** flow — register, authenticate, and retrieve user profiles
- **AI Generations** flow — generate fictional comments, AI images, and profile cards
- **External Integrations** flow — connect websites with Google Search Console and the link-building marketplace
- **Generate AI Content** flow — extract keywords, generate AI-powered content, and submit URLs for Google indexing
- **Manage Websites** flow — register, update, search, delete websites, and generate legal pages
- **Payments & Subscriptions** flow — check billing, create payment transactions, view history, and check subscription details
- Homepage quick-link cards for all new integration flows
- Sidebar navigation entries for all new flows

### Changed

- Updated homepage layout to accommodate new flow cards
- Minor fixes to the Generate Invoice flow

## [0.2.0] — 2026-03-14

### Added

- Custom Logo component with branded "1Platform" text rendering
- CLAUDE.md with full project documentation, design system, and development guidelines
- Claude Code skills configuration (`.claude/`)
- Light-first design system harmonized with `1platform.pro` brand
- Dark mode support with toggle and system preference detection
- Cross-project navigation link back to `1platform.pro`

### Changed

- **Homepage redesign:** new hero section, feature cards, and developer-focused layout
- **Global CSS overhaul:** new color palette, typography (Inter + JetBrains Mono), rounded code blocks, refined surfaces and borders
- **Docusaurus config:** updated branding, metadata, navbar, footer, and Scalar API reference settings
- **Invoice flow docs:** expanded with full FEL report metadata, corrected TribuTax config (App-level keys instead of env vars), improved cURL examples
- **OpenAPI fetch script:** improved error handling and server injection
- **Node.js version:** upgraded from 22 to 24 (`.nvmrc`)

## [0.1.0] — Initial Release

### Added

- Docusaurus 3.9 project setup with Scalar OpenAPI reference
- Invoice generation flow documentation
- OpenAPI spec auto-fetch pipeline
