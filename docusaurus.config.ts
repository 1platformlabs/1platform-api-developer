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
        showNavLink: false,
        configuration: {
          // Served from static/openapi.json (downloaded at build time by prebuild script).
          // Using the local copy avoids CORS issues in production.
          url: OPENAPI_LOCAL_PATH,
          // Proxy requests through Scalar to avoid CORS issues when using "Send" in the browser.
          proxy: 'https://proxy.scalar.com',
          // Default to light mode (matches the 1Platform Design System).
          // Users can still toggle dark via the sun/moon button.
          darkMode: false,
          customCss: `
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
          `,
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
      respectPrefersColorScheme: false,
    },
    navbar: {
      // Mirrors the marketing website navbar (1platform.pro) so users experience
      // a seamless subdomain transition. Keep item order and labels in sync with
      // 1platform-website/src/components/Header.astro.
      items: [
        {
          href: 'https://1platform.pro/solutions/',
          label: 'Solutions',
          position: 'left',
          target: '_self',
        },
        {
          href: 'https://1platform.pro/features/',
          label: 'Features',
          position: 'left',
          target: '_self',
        },
        {
          href: 'https://1platform.pro/pricing/',
          label: 'Pricing',
          position: 'left',
          target: '_self',
        },
        {
          to: '/',
          label: 'Docs',
          position: 'left',
          activeBaseRegex: '^/(docs|api-docs)?/?$|^/(docs|api-docs)/.*',
        },
        {
          href: 'https://1platform.pro/blog/',
          label: 'Blog',
          position: 'left',
          target: '_self',
        },
        {
          href: 'https://app.1platform.pro',
          label: 'Get Started Free',
          position: 'right',
          className: 'navbar__cta',
        },
      ],
    },
    // Footer content is rendered by the custom swizzle at
    // src/theme/Footer/index.tsx, which mirrors the marketing-site footer.
    // This config stub is kept only so Docusaurus mounts the Footer slot.
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
