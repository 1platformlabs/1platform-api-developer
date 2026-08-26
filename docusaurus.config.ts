import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ─── API Reference (Scalar) configuration ───────────────────────────────────
// One Scalar instance per SaaS API. Specs are served from static/openapi/<id>.json
// (downloaded at build time by scripts/fetch-openapi.mjs, committed as cache).
// Each instance MUST have a unique `id`.
//
// Scalar's theme is NOT configured here. It used to re-declare the whole
// palette as hex literals, which made this file a second place where colour
// was decided and guaranteed drift from the stylesheet. The `--scalar-*`
// variables now live in src/css/custom.css, mapped onto the same tokens as
// everything else.
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
    },
  },
];


// ── Redirect helpers (see the plugin block below for why these are explicit) ──
//
// Every retired route existed in TWO shapes and both answered 200: the nested
// one Docusaurus generates from the file tree, and the flat one the old
// createRedirects served. Each helper emits both, so a slug can never be
// covered in one shape and 404 in the other.
const flowRedirects = (slug: string, to: string) => [
  {from: `/docs/saas/1platform-api/flows/${slug}`, to: `/docs/saas/1platform-api/${to}`},
  {from: `/docs/flows/${slug}`, to: `/docs/saas/1platform-api/${to}`},
];

const webhookRedirects = (slug: string, to: string) => [
  {from: `/docs/saas/1platform-api/webhooks/${slug}`, to: `/docs/saas/1platform-api/${to}`},
  {from: `/docs/webhooks/${slug}`, to: `/docs/saas/1platform-api/${to}`},
];

// The 65 withdrawn per-tenant pages, taken from the pre-cut sitemap rather than
// from filenames: each section's index.mdx publishes as `<section>/overview`,
// so a filename-derived list would miss three URLs and invent three others.
const PRODUCT_PAGES = [
  'atlas-app/achievements',
  'atlas-app/app-exclusive-content',
  'atlas-app/app-store-presence',
  'atlas-app/authentication',
  'atlas-app/content-browser',
  'atlas-app/devices',
  'atlas-app/freemium',
  'atlas-app/getting-started',
  'atlas-app/multi-tenant-isolation',
  'atlas-app/offline-downloads',
  'atlas-app/overview',
  'atlas-app/parental-controls',
  'atlas-app/personalization',
  'atlas-app/playback',
  'atlas-app/profile-security',
  'atlas-app/push-notifications',
  'atlas-app/reader-experience',
  'atlas-app/releases-and-updates',
  'atlas-app/subscription-management',
  'atlas-app/watchlist-library',
  'atlas-app/white-label-branding',
  'atlas-dashboard/admin-roles',
  'atlas-dashboard/ads-and-revenue',
  'atlas-dashboard/analytics',
  'atlas-dashboard/app-analytics',
  'atlas-dashboard/app-storefront',
  'atlas-dashboard/audit-log',
  'atlas-dashboard/branding-appearance',
  'atlas-dashboard/catalog-and-taxonomy',
  'atlas-dashboard/content-management',
  'atlas-dashboard/copy-customization',
  'atlas-dashboard/custom-code',
  'atlas-dashboard/getting-started',
  'atlas-dashboard/live-channels',
  'atlas-dashboard/members',
  'atlas-dashboard/notifications',
  'atlas-dashboard/overview',
  'atlas-dashboard/parental-controls',
  'atlas-dashboard/promotional-rails',
  'atlas-dashboard/purchases-and-rentals',
  'atlas-dashboard/redirects',
  'atlas-dashboard/seo-configuration',
  'atlas-dashboard/seo-health',
  'atlas-dashboard/storefront-pages',
  'atlas-dashboard/subscription-tiers',
  'atlas-dashboard/tenant-settings',
  'dashboard/admin-impersonation',
  'dashboard/admin-logs',
  'dashboard/api-keys',
  'dashboard/billing-credits',
  'dashboard/branding-appearance',
  'dashboard/dashboard-home',
  'dashboard/domains',
  'dashboard/getting-started',
  'dashboard/invoicing',
  'dashboard/invoicing-businesses',
  'dashboard/modules',
  'dashboard/onboarding',
  'dashboard/overview',
  'dashboard/settings-notifications',
  'dashboard/settings-profile',
  'dashboard/settings-security',
  'dashboard/settings-workspace',
  'dashboard/team-and-roles',
  'dashboard/transactions',
];

const config: Config = {
  title: 'Documentación para desarrolladores de 1Platform',
  tagline: 'Integra tu aplicación con las APIs SaaS de 1Platform',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://developer.1platform.pro',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  // Deliberately NOT 'throw', and this is the measurement rather than a
  // preference. The API reference is a Scalar plugin that renders CLIENT-SIDE
  // from static/openapi/<id>.json, so its `tag/...` ids do not exist in the
  // HTML Docusaurus inspects at build time. Turning this to 'throw' on an
  // otherwise untouched tree failed the build reporting ALL 21 existing
  // anchors as broken — including rows that demonstrably work on the live
  // site. It cannot tell a good anchor from a bad one here, so as a gate it
  // would only teach someone to switch it off.
  //
  // The half that does break — a slug that names no tag, because of a typo or
  // an upstream rename — is checked by scripts/check-api-anchors.mjs, which
  // reads the same spec the reference renders and ships with its own self-test.
  onBrokenAnchors: 'warn',

  // ─── Typography ───────────────────────────────────────────────────────────
  // The @font-face rules live HERE rather than in src/css/custom.css, and the
  // reason is measurable: webpack's css-loader rewrites any `url()` it can
  // resolve into a content-hashed copy under /assets/fonts/. With the faces
  // declared in the stylesheet, every file shipped twice — the static
  // passthrough and the hashed copy — and the preloads below pointed at the
  // static path while the page actually fetched the hashed one. The browser made
  // seven woff2 requests for six faces, and the "preload" was 24 KB that nothing
  // used. Declared here, the URL never passes through webpack, so the preload
  // and the @font-face agree by construction.
  //
  // The two preloaded faces are the ones that render above the fold on every
  // page: the display face that draws the h1 and the text face that draws the
  // body. `crossorigin` is required even same-origin, because a font fetch is
  // always CORS-mode and omitting it downloads the file a second time.
  headTags: [
    {
      tagName: 'style',
      attributes: {},
      innerHTML: [
        "@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-latin-500-normal.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}",
        "@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-latin-700-normal.woff2') format('woff2');font-weight:700;font-style:normal;font-display:swap}",
        "@font-face{font-family:'Inter';src:url('/fonts/inter-latin-400-normal.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}",
        "@font-face{font-family:'Inter';src:url('/fonts/inter-latin-500-normal.woff2') format('woff2');font-weight:500;font-style:normal;font-display:swap}",
        "@font-face{font-family:'Inter';src:url('/fonts/inter-latin-600-normal.woff2') format('woff2');font-weight:600;font-style:normal;font-display:swap}",
        "@font-face{font-family:'JetBrains Mono';src:url('/fonts/jetbrains-mono-latin-400-normal.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}",
      ].join(''),
    },
    // The portal is light-only (see colorMode below). Declaring it means the
    // browser chrome and form controls match the paper surface instead of
    // guessing from the OS preference.
    {
      tagName: 'meta',
      attributes: {name: 'theme-color', content: '#F6F5F2'},
    },
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
    // Backward-compat. The root `/` is handled by src/pages/index.tsx (a
    // <Redirect> to /docs/), since this site is pure documentation — the
    // marketing home lives at 1platform.pro.
    //
    // ── Why these are explicit and createRedirects is gone ──────────────────
    //
    // `createRedirects(existingPath)` is called ONCE PER PAGE THAT EXISTS in the
    // build, and what it returns are old paths pointing AT that page. A page
    // that was deleted is therefore never passed to it, and no redirect is ever
    // produced. Cloning the old pattern for withdrawn routes yields zero entries
    // and a green build — the failure is completely silent.
    //
    // The old createRedirects also could not survive this epic even for the
    // pages that live on: every flows/ slug changed (23 pages consolidated into
    // 8 journeys with different names), so it would have generated redirects
    // pointing at pages that no longer exist.
    //
    // Both URL shapes are covered. `/docs/flows/<slug>` (flat) and
    // `/docs/saas/1platform-api/flows/<slug>` (nested) BOTH return 200 today —
    // the flat form was served by that createRedirects. Measured live before the
    // cut: all 23 flat flow URLs and all 6 flat webhook URLs answered 200, and
    // 1platform-dashboard links to /docs/flows/generate-ai-content from two
    // production screens (DashboardHomePage, OnboardingWizardPage). Dropping the
    // flat form would 404 those CTAs on deploy day.
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {from: '/api-docs', to: '/api-reference/1platform-api'},

          // Entry points that already 404 today, referenced 4× across the
          // ecosystem (transactional emails and the dashboard onboarding
          // wizard). Broken before this epic; the cut is when they get fixed.
          {from: '/docs/quick-start', to: '/docs/saas/1platform-api/getting-started'},
          {from: '/docs/flows', to: '/docs/saas/1platform-api/journeys/autenticacion'},

          // ── Flows absorbed by a journey → the journey that replaced them ──
          ...flowRedirects('magic-link-authentication', 'journeys/autenticacion'),
          ...flowRedirects('user-onboarding', 'journeys/autenticacion'),
          ...flowRedirects('generate-ai-content', 'journeys/generar-contenido'),
          ...flowRedirects('ai-generations', 'journeys/generar-contenido'),
          ...flowRedirects('payments-and-subscriptions', 'journeys/cobros-y-saldo'),
          ...flowRedirects('billing-holds-and-captures', 'journeys/cobros-y-saldo'),
          ...flowRedirects('paid-onboarding', 'journeys/cobros-y-saldo'),
          ...flowRedirects('generate-invoice', 'journeys/facturacion'),
          ...flowRedirects('webhook-configuration', 'journeys/webhooks'),
          ...flowRedirects('ai-agents', 'journeys/agentes'),

          // ── Flows that kept a journey of their own ───────────────────────
          ...flowRedirects('google-analytics', 'journeys/google-analytics'),
          ...flowRedirects('google-adsense', 'journeys/google-adsense'),

          // ── Flows withdrawn without a successor → the capability index, ──
          // which names their tag and links into the reference.
          ...flowRedirects('activity-logs', 'capacidades'),
          ...flowRedirects('admin-operations', 'capacidades'),
          ...flowRedirects('dashboard-overview', 'capacidades'),
          ...flowRedirects('dashboard-settings', 'capacidades'),
          ...flowRedirects('domain-management', 'capacidades'),
          ...flowRedirects('external-integrations', 'capacidades'),
          ...flowRedirects('manage-websites', 'capacidades'),
          ...flowRedirects('notifications', 'capacidades'),
          ...flowRedirects('referrals', 'capacidades'),
          ...flowRedirects('support', 'capacidades'),
          ...flowRedirects('tasks', 'capacidades'),

          // ── Webhook pages: three folded into the journey, three moved to
          // the reference (the "why" the OpenAPI spec cannot carry). ────────
          ...webhookRedirects('overview', 'journeys/webhooks'),
          ...webhookRedirects('configuring-urls', 'journeys/webhooks'),
          ...webhookRedirects('receiving-notifications', 'reference/webhooks-payload'),
          ...webhookRedirects('security', 'reference/webhooks-security'),
          ...webhookRedirects('retry-and-delivery', 'reference/retry-and-delivery'),
          ...webhookRedirects('code-samples', 'reference/webhooks-code-samples'),

          // ── Per-tenant operator docs, withdrawn (D-1) ────────────────────
          // No equivalent page: the audience is no longer this portal's. The
          // ecosystem links to none of these; the redirect is for external
          // readers and search engines.
          ...PRODUCT_PAGES.map((p) => ({from: `/docs/products/${p}`, to: '/docs/'})),
        ],
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
            {href: 'https://1platform.pro/solutions/deliveries/', label: 'Envíos', target: '_self'},
            {href: 'https://1platform.pro/solutions/ads/', label: 'Publicidad', target: '_self'},
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
