import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ─── API Configuration ───────────────────────────────────────────────────────
// OPENAPI_LOCAL_PATH: local copy served by the site, used by Scalar at runtime (avoids CORS).
// Remote source URL lives in scripts/fetch-openapi.mjs (keep them in sync).
const OPENAPI_LOCAL_PATH = '/openapi.json';
const ROUTE_API_REFERENCE = '/api-docs';

const config: Config = {
  title: '1Platform Api Developer',
  tagline: 'API documentation for 1Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://developer.1platform.pro',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
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

  // ─── Plugins ──────────────────────────────────────────────────────────────
  plugins: [
    // Scalar API Reference — single API setup.
    // Docs: https://github.com/scalar/scalar/tree/main/packages/docusaurus
    [
      '@scalar/docusaurus',
      {
        label: 'API Reference',
        route: ROUTE_API_REFERENCE,
        showNavLink: true,
        configuration: {
          // Served from static/openapi.json (downloaded at build time by prebuild script).
          // Using the local copy avoids CORS issues in production.
          url: OPENAPI_LOCAL_PATH,
          // Proxy requests through Scalar to avoid CORS issues when using "Send" in the browser.
          proxy: 'https://proxy.scalar.com',
        },
      },
    ],

    // To add a second API: https://github.com/scalar/scalar/tree/main/packages/docusaurus
    // Each additional instance MUST have a unique `id`.
  ],

  // ─── Theme ────────────────────────────────────────────────────────────────
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      items: [
        // "API Reference" link is auto-injected by @scalar/docusaurus (showNavLink: true).
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          label: 'Flows',
          position: 'left',
        },
        // Cross-project navigation — back to marketing site
        {
          href: 'https://1platform.pro',
          label: '1platform.pro',
          position: 'right',
          className: 'navbar__link--back',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'API',
          items: [
            {
              label: 'API Reference',
              to: ROUTE_API_REFERENCE,
            },
            {
              label: 'OpenAPI Spec (JSON)',
              href: 'pathname:///openapi.json',
            },
          ],
        },
        {
          title: 'Guides',
          items: [
            {
              label: 'Generate Invoice (FEL)',
              to: '/docs/flows/generate-invoice',
            },
          ],
        },
        {
          title: '1Platform',
          items: [
            {
              label: 'Website',
              href: 'https://1platform.pro',
            },
            {
              label: 'Solutions',
              href: 'https://1platform.pro/solutions/',
            },
            {
              label: 'Pricing',
              href: 'https://1platform.pro/pricing/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 1Platform Labs.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
