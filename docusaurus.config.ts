import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ─── API Configuration ───────────────────────────────────────────────────────
// Central place to define API-related constants.
// OPENAPI_PUBLIC_URL: remote source used by scripts/fetch-openapi.mjs to download the spec.
// OPENAPI_LOCAL_PATH: local path served by the site, used by Scalar at runtime (avoids CORS).
const OPENAPI_PUBLIC_URL = 'https://wpcontentai.1platform.pro/openapi.json';
const OPENAPI_LOCAL_PATH = '/openapi.json';
const ROUTE_API_REFERENCE = '/api-docs';

const config: Config = {
  title: '1Platform Api Developer',
  tagline: 'API documentation for 1Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://your-docusaurus-site.example.com',
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

    // ─── Multiple APIs (example, uncomment when needed) ───────────────────
    // When adding a second API, each plugin instance MUST have a unique `id`.
    //
    // [
    //   '@scalar/docusaurus',
    //   {
    //     id: 'api-payments',          // unique id required for multiple instances
    //     label: 'Payments API',
    //     route: '/api-payments',
    //     showNavLink: true,
    //     configuration: {
    //       // Option A: single URL
    //       url: 'https://example.com/payments/openapi.json',
    //
    //       // Option B: multiple sources in one page
    //       // sources: [
    //       //   { title: 'Payments v1', url: 'https://example.com/payments/v1/openapi.json' },
    //       //   { title: 'Payments v2', url: 'https://example.com/payments/v2/openapi.json' },
    //       // ],
    //     },
    //   },
    // ],
  ],

  // ─── Theme ────────────────────────────────────────────────────────────────
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '1Platform Api Developer',
      logo: {
        alt: '1Platform Logo',
        src: 'img/logo.svg',
      },
      items: [
        // "API Reference" link is auto-injected by @scalar/docusaurus (showNavLink: true).
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          label: 'Flows',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
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
              // pathname:// tells Docusaurus this is a static asset, not a route
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
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 1Platform. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
