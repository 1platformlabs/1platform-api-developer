import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './index.module.css';

type Card = {
  icon: string;
  iconClass: string;
  title: string;
  desc: string;
  href: string;
};

// Group A — configurable end-products (per tenant). Non-technical audience.
const TENANT_PRODUCTS: Card[] = [
  {
    icon: '🧭',
    iconClass: styles.iconBlue,
    title: '1Platform Dashboard',
    desc: translate({
      id: 'home.product.dashboard.desc',
      message:
        'The white-label control panel for billing, invoicing, domains, team, and every enabled module.',
    }),
    href: '/docs/products/dashboard/overview',
  },
  {
    icon: '📚',
    iconClass: styles.iconPurple,
    title: 'Atlas Dashboard',
    desc: translate({
      id: 'home.product.atlasDashboard.desc',
      message:
        'Run a branded content storefront — catalog, monetization, members, SEO, and the mobile app.',
    }),
    href: '/docs/products/atlas-dashboard/overview',
  },
  {
    icon: '📱',
    iconClass: styles.iconGreen,
    title: 'Atlas App',
    desc: translate({
      id: 'home.product.atlasApp.desc',
      message:
        'A white-label mobile app (iOS, Android, TV) with an in-app reader, offline downloads, and more.',
    }),
    href: '/docs/products/atlas-app/overview',
  },
];

// Group B — SaaS APIs. Developer audience.
const SAAS_PRODUCTS: Card[] = [
  {
    icon: '⚙️',
    iconClass: styles.iconBlue,
    title: '1Platform API',
    desc: translate({
      id: 'home.saas.onepApi.desc',
      message:
        'The core REST API — AI content, payments, invoicing, domains, agents — with two-token auth.',
    }),
    href: '/docs/saas/1platform-api/overview',
  },
  {
    icon: '🌐',
    iconClass: styles.iconOrange,
    title: 'Atlas API',
    desc: translate({
      id: 'home.saas.atlasApi.desc',
      message:
        'The standalone, multitenant content-delivery API — catalog, entitlements, delivery, webhooks.',
    }),
    href: '/docs/saas/atlas-api/overview',
  },
];

const QUICKLINKS: Card[] = [
  {
    icon: '🔌',
    iconClass: styles.iconBlue,
    title: translate({id: 'home.quick.apiref.title', message: 'API Reference'}),
    desc: translate({id: 'home.quick.apiref.desc', message: 'Browse and test every endpoint, live.'}),
    href: '/docs/saas/api-reference-index',
  },
  {
    icon: '🚀',
    iconClass: styles.iconGreen,
    title: translate({id: 'home.quick.start.title', message: 'Getting started'}),
    desc: translate({id: 'home.quick.start.desc', message: 'Make your first authenticated call.'}),
    href: '/docs/saas/1platform-api/getting-started',
  },
  {
    icon: '🧩',
    iconClass: styles.iconPurple,
    title: translate({id: 'home.quick.flows.title', message: 'Integration flows'}),
    desc: translate({id: 'home.quick.flows.desc', message: 'End-to-end workflows, step by step.'}),
    href: '/docs/saas/1platform-api/flows/generate-invoice',
  },
  {
    icon: '🔔',
    iconClass: styles.iconOrange,
    title: translate({id: 'home.quick.webhooks.title', message: 'Webhooks'}),
    desc: translate({id: 'home.quick.webhooks.desc', message: 'React to events as they happen.'}),
    href: '/docs/saas/1platform-api/webhooks/overview',
  },
];

function CardGrid({cards, columns}: {cards: Card[]; columns: 2 | 3}): ReactNode {
  return (
    <div className={columns === 2 ? styles.productGrid2 : styles.productGrid3}>
      {cards.map((c) => (
        <Link key={c.href} className={styles.card} to={c.href}>
          <div className={`${styles.cardIconBadge} ${c.iconClass}`} aria-hidden="true">
            {c.icon}
          </div>
          <div className={styles.cardTitle}>{c.title}</div>
          <p className={styles.cardDesc}>{c.desc}</p>
          <span className={styles.cardArrow} aria-hidden="true">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({id: 'home.meta.title', message: 'Developer Docs'})}
      description={translate({
        id: 'home.meta.description',
        message:
          'Configure 1Platform end-products per tenant, or build your own ecosystem on the 1Platform and Atlas APIs.',
      })}>
      {/* Hero — the two objectives */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>developer.1platform.pro</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroAccent}>1</span>
            <Translate id="home.hero.title">Platform Developer Docs</Translate>
          </h1>
          <p className={styles.heroSubtitle}>
            <Translate id="home.hero.subtitle">
              Configure ready-made products per tenant, or build your own ecosystem on top of our SaaS
              APIs — the same infrastructure that powers 1Platform.
            </Translate>
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.primaryBtn} to="/docs/products/dashboard/overview">
              <Translate id="home.hero.cta.products">Explore products</Translate>
            </Link>
            <Link className={styles.ghostBtn} to="/docs/saas/api-reference-index">
              <Translate id="home.hero.cta.api">API reference</Translate>
            </Link>
          </div>
        </div>
      </header>

      {/* Cluster 1 — Products per tenant */}
      <section className={styles.cards}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.tenant.title">Products (per tenant)</Translate>
          </h2>
          <p className={styles.sectionSub}>
            <Translate id="home.tenant.sub">
              Ready-made 1Platform products, configurable for each tenant — no code required.
            </Translate>
          </p>
        </div>
        <CardGrid cards={TENANT_PRODUCTS} columns={3} />
      </section>

      {/* Cluster 2 — SaaS & API */}
      <section className={styles.cardsAlt}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.saas.title">SaaS &amp; API</Translate>
          </h2>
          <p className={styles.sectionSub}>
            <Translate id="home.saas.sub">
              Build your own ecosystem on the same infrastructure, through versioned REST APIs.
            </Translate>
          </p>
        </div>
        <CardGrid cards={SAAS_PRODUCTS} columns={2} />
      </section>

      {/* Quicklinks */}
      <section className={styles.cards}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            <Translate id="home.quick.title">Jump in</Translate>
          </h2>
        </div>
        <CardGrid cards={QUICKLINKS} columns={2} />
      </section>
    </Layout>
  );
}
