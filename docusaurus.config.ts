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
  title: 'Documentación para desarrolladores de 1Platform',
  tagline: 'Productos configurables y APIs SaaS sobre la infraestructura de 1Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://developer.1platform.pro',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  // Preload the two faces that render above the fold on every page: the display
  // face that draws the h1 and the text face that draws the body. The other
  // four are discovered from the stylesheet as usual. `crossorigin` is required
  // even same-origin — a font fetch is always CORS-mode, and without it the
  // browser downloads the file twice.
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/space-grotesk-latin-700-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/fonts/inter-latin-400-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
  ],

  // Spanish-only for now: the source content is the canonical Spanish version
  // (audited and improved here). English will be re-introduced later as a
  // translated, non-default locale. Single locale ⇒ no locale switcher.
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
    localeConfigs: {
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
    // Offline local search (zero infra). Resolves the search box in the navbar.
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['es'],
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
    // The root `/` is handled by src/pages/index.tsx (a <Redirect> to /docs/),
    // since this site is pure documentation — the marketing home lives at
    // 1platform.pro.
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
          label: 'Soluciones',
          position: 'left',
          href: 'https://1platform.pro/solutions/',
          items: [
            {href: 'https://1platform.pro/solutions/online-store/', label: 'Tienda online', target: '_self'},
            {href: 'https://1platform.pro/solutions/website/', label: 'Creador de sitios web', target: '_self'},
            {href: 'https://1platform.pro/solutions/content/', label: 'Contenido con IA', target: '_self'},
            {href: 'https://1platform.pro/solutions/whitelabel/', label: 'Panel white-label', target: '_self'},
            {href: 'https://1platform.pro/payments-invoicing/', label: 'Pagos y facturación', target: '_self'},
            // The site separates the five solutions from the catch-all link
            // with a rule; mirror it so the two menus read identically.
            {type: 'html', value: '<hr class="dropdown__divider" />'},
            {href: 'https://1platform.pro/solutions/', label: 'Ver todas las soluciones', target: '_self'},
          ],
        },
        {href: 'https://1platform.pro/features/', label: 'Funciones', position: 'left', target: '_self'},
        {href: 'https://1platform.pro/pricing/', label: 'Precios', position: 'left', target: '_self'},
        {
          to: '/',
          label: 'Documentación',
          position: 'left',
          activeBaseRegex: '^/(docs|api-reference)?/?$|^/(docs|api-reference)/.*',
        },
        {href: 'https://1platform.pro/blog/', label: 'Blog', position: 'left', target: '_self'},
        {href: 'https://app.1platform.pro', label: 'Comenzar gratis', position: 'right', className: 'navbar__cta'},
      ],
    },
    // Footer content is rendered by the custom swizzle at src/theme/Footer/index.tsx.
    footer: {
      style: 'light',
      copyright: `© ${new Date().getFullYear()} 1Platform Labs. Todos los derechos reservados.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
