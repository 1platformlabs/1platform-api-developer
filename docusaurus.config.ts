import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ─── API Reference (Scalar) configuration ───────────────────────────────────
// One Scalar instance per SaaS API. Specs are served from static/openapi/<id>.json
// (downloaded at build time by scripts/fetch-openapi.mjs, committed as cache).
// Each instance MUST have a unique `id`.
const SCALAR_LIGHT_CSS = `
  .light-mode {
    --scalar-color-accent: #2563eb;
    --scalar-color-1: #0f172a;
    --scalar-color-2: #475569;
    --scalar-color-3: #64748b;
    --scalar-background-1: #ffffff;
    --scalar-background-2: #f8fafc;
    --scalar-background-3: #f1f5f9;
    --scalar-border-color: #e2e8f0;
    --scalar-font: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --scalar-font-code: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  }
`;

const scalarPlugin = (id: string, label: string, route: string, specPath: string) => [
  '@scalar/docusaurus',
  {
    id,
    label,
    route,
    showNavLink: false,
    configuration: {
      url: specPath,
      proxy: 'https://proxy.scalar.com',
      darkMode: false,
      forceDarkModeState: 'light' as const,
      hideDarkModeToggle: true,
      customCss: SCALAR_LIGHT_CSS,
    },
  },
];

const config: Config = {
  title: '1Platform Developer Docs',
  tagline: 'Configurable products and SaaS APIs on the 1Platform infrastructure',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://developer.1platform.pro',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  // English by default, fully available in Spanish.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en'},
      es: {label: 'Español', htmlLang: 'es'},
    },
  },

  // ─── Presets ──────────────────────────────────────────────────────────────
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // ─── Themes ─────────────────────────────────────────────────────────────────
  themes: [
    // Offline local search (zero infra, bilingual). Resolves the search box in the navbar.
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en', 'es'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  // ─── Plugins ──────────────────────────────────────────────────────────────
  plugins: [
    // SaaS API references (one Scalar instance per API).
    scalarPlugin(
      '1platform-api',
      '1Platform API',
      '/api-reference/1platform-api',
      '/openapi/1platform-api.json',
    ),
    scalarPlugin(
      'atlas-api',
      'Atlas API',
      '/api-reference/atlas-api',
      '/openapi/atlas-api.json',
    ),
    // Backward-compat: old single-API route + migrated 1Platform API doc paths.
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {from: '/api-docs', to: '/api-reference/1platform-api'},
        ],
        // Old flat /docs/{flows,reference,webhooks}/* → new /docs/saas/1platform-api/*.
        createRedirects(existingPath: string) {
          const m = existingPath.match(
            /^\/docs\/saas\/1platform-api\/(flows|reference|webhooks)\/(.+)$/,
          );
          if (m) {
            return [`/docs/${m[1]}/${m[2]}`];
          }
          return undefined;
        },
      },
    ],
  ],

  // ─── Theme ────────────────────────────────────────────────────────────────
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      // Mirrors the marketing website navbar (1platform.pro) — keep item order
      // and labels in sync with 1platform-website/src/components/Header.astro.
      items: [
        {
          type: 'dropdown',
          label: 'Solutions',
          position: 'left',
          href: 'https://1platform.pro/solutions/',
          items: [
            {href: 'https://1platform.pro/solutions/online-store/', label: 'Online Store', target: '_self'},
            {href: 'https://1platform.pro/solutions/website/', label: 'Website Builder', target: '_self'},
            {href: 'https://1platform.pro/solutions/content/', label: 'AI Content', target: '_self'},
            {href: 'https://1platform.pro/solutions/whitelabel/', label: 'Whitelabel Dashboard', target: '_self'},
            {href: 'https://1platform.pro/payments-invoicing/', label: 'Payments & Invoicing', target: '_self'},
            {href: 'https://1platform.pro/solutions/', label: 'View all solutions', target: '_self'},
          ],
        },
        {href: 'https://1platform.pro/features/', label: 'Features', position: 'left', target: '_self'},
        {href: 'https://1platform.pro/pricing/', label: 'Pricing', position: 'left', target: '_self'},
        {
          to: '/',
          label: 'Docs',
          position: 'left',
          activeBaseRegex: '^/(docs|api-reference)?/?$|^/(docs|api-reference)/.*',
        },
        {href: 'https://1platform.pro/blog/', label: 'Blog', position: 'left', target: '_self'},
        {type: 'localeDropdown', position: 'right'},
        {href: 'https://app.1platform.pro', label: 'Get Started Free', position: 'right', className: 'navbar__cta'},
      ],
    },
    // Footer content is rendered by the custom swizzle at src/theme/Footer/index.tsx.
    footer: {
      style: 'light',
      copyright: `© ${new Date().getFullYear()} 1Platform Labs. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
