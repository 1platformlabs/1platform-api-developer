# Product composition snapshots

These four review snapshots come from the production build served locally and
show the two public entry points at the review widths required by the product
contract:

- `docs-desktop-1440.png` — `/docs/`, 1440 x 1100.
- `docs-mobile-390.png` — `/docs/`, 390 x 844.
- `api-desktop-1440.png` — `/api-reference/1platform-api`, 1440 x 1100.
- `api-mobile-390.png` — `/api-reference/1platform-api`, 390 x 844.

`pnpm check:public-ui` verifies that every snapshot exists and still has its
declared viewport. The same guard validates the rendered routes, accessibility
contracts, CTAs, SEO metadata, reduced motion and asset budgets; update a PNG
only after inspecting the replacement at its native size.
