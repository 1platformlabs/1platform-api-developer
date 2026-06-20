import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Card grid used on the docs landing page (docs/intro.mdx). Extracted from the
 * former standalone marketing homepage so the same product/API entry points now
 * live inside the documentation layout (sidebar + breadcrumb + TOC).
 */
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
    <div className={columns === 2 ? styles.grid2 : styles.grid3}>
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

export function ProductCards(): ReactNode {
  return <CardGrid cards={TENANT_PRODUCTS} columns={3} />;
}

export function SaasCards(): ReactNode {
  return <CardGrid cards={SAAS_PRODUCTS} columns={2} />;
}

export function QuickCards(): ReactNode {
  return <CardGrid cards={QUICKLINKS} columns={2} />;
}
