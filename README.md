<h1 align="center">1Platform — API Developer Documentation</h1>

<p align="center"><strong>One platform. Every solution.</strong></p>

<p align="center">
  Source code for <a href="https://developer.1platform.pro">developer.1platform.pro</a> — the interactive API reference, integration flows and code examples for the <a href="https://api.1platform.pro/api/v1/">1Platform REST API</a>.
</p>

<p align="center">
  <a href="https://developer.1platform.pro"><img src="https://img.shields.io/badge/Docs-developer.1platform.pro-2563eb?style=flat-square" alt="Live docs" /></a>
  <img src="https://img.shields.io/badge/Docusaurus-3.9-3ECC5F?logo=docusaurus&logoColor=white&style=flat-square" alt="Docusaurus 3.9" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="MIT License" />
</p>

---

## What's in here

Interactive documentation covering:

- **OpenAPI reference** (powered by Scalar) auto-generated from the live spec
- **9 integration flows** — invoicing, onboarding, AI agents, content generation, payments, websites, logs, link building, AI generations
- **Full request/response examples** in every flow, using copy-ready `curl` snippets
- **Auth model** — two-token system (app token + user token)

## Stack

- **[Docusaurus 3.9](https://docusaurus.io/)** — static documentation site generator
- **React 19** · **TypeScript 5.6** · **MDX**
- **[@scalar/docusaurus](https://github.com/scalar/scalar)** — interactive API reference
- Package manager: **pnpm** · Node: **24** (see `.nvmrc`)
- Output: `build/` with pure static HTML/CSS/JS

## Development

```bash
pnpm install
pnpm start           # → http://localhost:3001 (hot reload)
pnpm build           # → build/ (production, runs fetch-openapi first)
pnpm fetch-openapi   # Manually refresh static/openapi.json
pnpm typecheck       # TypeScript check
```

The `build` script first runs `scripts/fetch-openapi.mjs` which downloads the latest spec from `https://api.1platform.pro/openapi.json` (override with `OPENAPI_URL` env var).

## Structure

```
docs/flows/          9 integration flow MDX files (~5,800 lines)
src/
├── pages/           Homepage (React)
├── theme/Logo/      Custom "1Platform" logo component
└── css/custom.css   Light theme (matches dev docs convention), harmonized with 1platform.pro
scripts/
└── fetch-openapi.mjs   OpenAPI spec fetcher (runs on prebuild)
static/              Public assets + generated openapi.json
docusaurus.config.ts Site config
sidebars.ts          Navigation
```

## Design

Light mode by default — intentionally differentiates technical docs from the dark-themed [marketing site](https://1platform.pro). Shared accent (`#2563eb`) and typography (Inter + JetBrains Mono) keep the brand consistent. Dark mode toggle respects system preference.

## Related

- **Marketing site:** [1platform.pro](https://1platform.pro) · [repo](https://github.com/1platformlabs/1platform-website)
- **WordPress plugin:** [wordpress.org](https://wordpress.org/plugins/1platform-content-ai/) · [repo](https://github.com/1platformlabs/1platform-content-ai)
- **Live API:** [api.1platform.pro/api/v1](https://api.1platform.pro/api/v1/) · [OpenAPI](https://api.1platform.pro/openapi.json)

## License

[MIT](./LICENSE) © 1Platform Labs
