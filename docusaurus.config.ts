import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import brandTokens from './src/css/brand-tokens.json';
import {scalarEnvironment} from './src/config/scalar-environment';

function publicOrigin(value: string | undefined, fallback: string): string {
  const url = new URL(value || fallback);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Public origins require an HTTP(S) URL without credentials');
  return url.origin;
}
const WEBSITE = publicOrigin(process.env.WEBSITE_URL, 'https://1platform.pro');
const DEVELOPER = publicOrigin(process.env.DEVELOPER_URL, 'https://developer.1platform.pro');
const GUIDE = '/docs/saas/1platform-api/getting-started';
const CONTACT = 'https://wa.me/50253946564';

// ─── API Reference (Scalar) configuration ───────────────────────────────────
// One Scalar instance per SaaS API. Specs are served from static/openapi/<id>.json
// (refreshed explicitly by scripts/fetch-openapi.mjs, committed as cache).
// Each instance MUST have a unique `id`.
//
// Scalar's theme is NOT configured here. It used to re-declare the whole
// palette as hex literals, which made this file a second place where colour
// was decided and guaranteed drift from the stylesheet. The `--scalar-*`
// variables now live in src/css/custom.css, mapped onto the same tokens as
// everything else.
const scalarPlugin = (id: '1platform-api' | 'atlas-api', label: string, route: string, specPath: string) => [
  './plugins/scalar-reference/index.cjs',
  {
    id,
    label,
    route,
    showNavLink: false,
    cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.72.3',
    configuration: {
      url: specPath,
      ...scalarEnvironment(id, process.env),
      layout: 'modern' as const,
      withDefaultFonts: false,
      showSidebar: true,
      hideSearch: false,
      hideModels: false,
      hideTestRequestButton: false,
      localization: {
        locale: 'es',
        translations: {navigation: {openMenu: 'Explorar endpoints', closeMenu: 'Cerrar catálogo'}},
      },
      agent: {disabled: true},
      mcp: {disabled: true},
      showDeveloperTools: 'never' as const,
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

// journeys/<slug> → <product>/<page>, one per page that existed under journeys/.
const JOURNEY_MOVES: Array<[string, string]> = [
  ['autenticacion', 'plataforma/autenticacion'],
  ['webhooks', 'plataforma/webhooks'],
  ['cobros-y-saldo', 'pagos-en-linea/cobrar-y-conciliar'],
  ['facturacion', 'facturacion-electronica/emitir-una-factura'],
  ['generar-contenido', 'sitios-web-y-contenido/generar-contenido'],
  ['google-analytics', 'analitica/google-analytics'],
  ['google-adsense', 'analitica/google-adsense'],
  ['telemetria', 'telemetria/integrar-telemetria'],
  ['agentes', 'agentes-de-ia/crear-un-agente'],
];

const config: Config = {
  title: 'Documentación para desarrolladores de 1Platform',
  tagline: 'Integre los servicios de 1Platform en su producto',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: DEVELOPER,
  customFields: {websiteUrl: WEBSITE, contactUrl: CONTACT, brandTokens},
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

  // Fonts remain in headTags so webpack does not duplicate their bytes under
  // hashed URLs. The preload and the face use the exact same local font URL.
  headTags: [
    {tagName: 'style', attributes: {}, innerHTML: [
      "@font-face{font-family:'Manrope';src:url('/fonts/manrope-variable.woff2') format('woff2');font-weight:200 800;font-style:normal;font-display:swap}",
      "@font-face{font-family:'JetBrains Mono';src:url('/fonts/jetbrains-mono-latin-400-normal.woff2') format('woff2');font-weight:400;font-style:normal;font-display:swap}",
      ':root{' + Object.entries(brandTokens).map(([role, value]) => `--brand-${role}:${value}`).join(';') + '}',
    ].join('')},
    {tagName: 'meta', attributes: {name: 'theme-color', content: brandTokens.navy}},
    {tagName: 'link', attributes: {rel: 'preload', href: '/fonts/manrope-variable.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous'}},
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
    // <Redirect> to Primeros pasos), since this site is pure documentation — the
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
          {from: '/docs', to: GUIDE},
          {from: '/docs/saas/1platform-api/overview', to: GUIDE},

          // Entry points that already 404 today, referenced 4× across the
          // ecosystem (transactional emails and the dashboard onboarding
          // wizard). Broken before this epic; the cut is when they get fixed.
          {from: '/docs/quick-start', to: GUIDE},
          {from: '/docs/flows', to: '/docs/saas/1platform-api/plataforma/autenticacion'},

          // ── Organización por producto (portada-por-productos) ────────────
          // The journeys moved into the product they belong to, the capability
          // index was replaced by the products themselves, and the "which API"
          // page by the home. Every old URL lands on its successor.
          ...JOURNEY_MOVES.map(([from, to]) => ({from: `/docs/saas/1platform-api/journeys/${from}`, to: `/docs/saas/1platform-api/${to}`})),
          {from: '/docs/saas/1platform-api/capacidades', to: GUIDE},
          {from: '/docs/saas/api-reference-index', to: GUIDE},

          // ── Flows absorbed by a journey → the journey that replaced them ──
          ...flowRedirects('magic-link-authentication', 'plataforma/autenticacion'),
          ...flowRedirects('user-onboarding', 'plataforma/autenticacion'),
          ...flowRedirects('generate-ai-content', 'sitios-web-y-contenido/generar-contenido'),
          ...flowRedirects('ai-generations', 'sitios-web-y-contenido/generar-contenido'),
          ...flowRedirects('payments-and-subscriptions', 'pagos-en-linea/cobrar-y-conciliar'),
          ...flowRedirects('billing-holds-and-captures', 'pagos-en-linea/cobrar-y-conciliar'),
          ...flowRedirects('paid-onboarding', 'pagos-en-linea/cobrar-y-conciliar'),
          ...flowRedirects('generate-invoice', 'facturacion-electronica/emitir-una-factura'),
          ...flowRedirects('webhook-configuration', 'plataforma/webhooks'),
          ...flowRedirects('ai-agents', 'agentes-de-ia/crear-un-agente'),

          // ── Flows that kept a journey of their own ───────────────────────
          ...flowRedirects('google-analytics', 'analitica/google-analytics'),
          ...flowRedirects('google-adsense', 'analitica/google-adsense'),

          // ── Flows withdrawn without a page of their own → the product (or
          // Plataforma) whose overview names their tag and links the reference.
          ...flowRedirects('activity-logs', 'plataforma'),
          ...flowRedirects('admin-operations', 'plataforma'),
          ...flowRedirects('dashboard-overview', 'plataforma'),
          ...flowRedirects('dashboard-settings', 'plataforma'),
          ...flowRedirects('domain-management', 'dominios-y-correo'),
          ...flowRedirects('external-integrations', 'sitios-web-y-contenido'),
          ...flowRedirects('manage-websites', 'sitios-web-y-contenido'),
          ...flowRedirects('notifications', 'plataforma'),
          ...flowRedirects('referrals', 'plataforma'),
          ...flowRedirects('support', 'plataforma'),
          ...flowRedirects('tasks', 'plataforma'),

          // ── Webhook pages: three folded into the journey, three moved to
          // the reference (the "why" the OpenAPI spec cannot carry). ────────
          ...webhookRedirects('overview', 'plataforma/webhooks'),
          ...webhookRedirects('configuring-urls', 'plataforma/webhooks'),
          ...webhookRedirects('receiving-notifications', 'reference/webhooks-payload'),
          ...webhookRedirects('security', 'reference/webhooks-security'),
          ...webhookRedirects('retry-and-delivery', 'reference/retry-and-delivery'),
          ...webhookRedirects('code-samples', 'reference/webhooks-code-samples'),

          // ── Per-tenant operator docs, withdrawn (D-1) ────────────────────
          // No equivalent page: the audience is no longer this portal's. The
          // ecosystem links to none of these; the redirect is for external
          // readers and search engines.
          ...PRODUCT_PAGES.map((p) => ({from: `/docs/products/${p}`, to: GUIDE})),
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
      //
      // The shared opaque navy rail keeps these public destinations visible on
      // desktop. The native compact drawer owns the same list on mobile.
      items: [
        {href: `${WEBSITE}/es/#capacidades`, label: 'Soluciones', position: 'left', target: '_self'},
        {href: `${WEBSITE}/es/#arquitectura`, label: 'Infraestructura', position: 'left', target: '_self'},
        {href: `${WEBSITE}/es/#inteligencia`, label: 'IA', position: 'left', target: '_self'},
        {href: `${WEBSITE}/es/blog/`, label: 'Blog', position: 'left', target: '_self'},
        {to: GUIDE, label: 'Documentación', position: 'left', activeBaseRegex: '^/(docs|api-reference)/.*'},
        {href: CONTACT, label: 'Contacto', position: 'left', target: '_self'},
        {href: CONTACT, label: 'Hablemos de su proyecto', position: 'right', target: '_self', className: 'navbar__cta'},
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
