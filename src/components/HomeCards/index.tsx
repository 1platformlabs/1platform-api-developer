import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';

import Icon, {type IconName} from '@site/src/components/Icon';
import styles from './styles.module.css';

/**
 * Card grid used on the docs landing page (docs/intro.mdx). Extracted from the
 * former standalone marketing homepage so the same product/API entry points now
 * live inside the documentation layout (sidebar + breadcrumb + TOC).
 *
 * SOURCE OF TRUTH FOR THESE STRINGS: the `message` values below.
 *
 * `i18n/es/code.json` used to carry a copy of all thirteen of them. Because
 * Spanish is the default AND only locale, that copy is what actually rendered,
 * so editing this file changed nothing on the page — and the two had already
 * drifted (the shipped Dashboard blurb read "facturación, facturas", a
 * redundant pair, where the source read the better "cobros, facturación").
 * Those overrides are gone; `code.json` now holds only real `theme.*` UI
 * translations. If a second locale is ever added, translate via `code.json` for
 * THAT locale and leave these as the source.
 */
type Card = {
  icon: IconName;
  title: string;
  desc: string;
  href: string;
};

// Group A — configurable end-products (per tenant). Non-technical audience.
const TENANT_PRODUCTS: Card[] = [
  {
    icon: 'dashboard',
    title: '1Platform Dashboard',
    desc: translate({
      id: 'home.product.dashboard.desc',
      message:
        'El panel de control white-label para cobros, facturación, dominios, equipo y cada módulo habilitado.',
    }),
    href: '/docs/products/dashboard/overview',
  },
  {
    icon: 'layers',
    title: 'Atlas Dashboard',
    desc: translate({
      id: 'home.product.atlasDashboard.desc',
      message:
        'Opera una tienda de contenido con tu marca: catálogo, monetización, miembros, SEO y la app móvil.',
    }),
    href: '/docs/products/atlas-dashboard/overview',
  },
  {
    icon: 'mobile',
    title: 'Atlas App',
    desc: translate({
      id: 'home.product.atlasApp.desc',
      message:
        'Una app móvil white-label (iOS, Android, TV) con lector integrado, descargas offline y más.',
    }),
    href: '/docs/products/atlas-app/overview',
  },
];

// Group B — SaaS APIs. Developer audience.
const SAAS_PRODUCTS: Card[] = [
  {
    icon: 'code',
    title: '1Platform API',
    desc: translate({
      id: 'home.saas.onepApi.desc',
      message:
        'La API REST principal: contenido con IA, pagos, facturación, dominios y agentes, con autenticación de dos tokens.',
    }),
    href: '/docs/saas/1platform-api/overview',
  },
  {
    icon: 'globe',
    title: 'Atlas API',
    desc: translate({
      id: 'home.saas.atlasApi.desc',
      message:
        'La API independiente y multitenant de entrega de contenido: catálogo, entitlements, entrega y webhooks.',
    }),
    href: '/docs/saas/atlas-api/overview',
  },
];

const QUICKLINKS: Card[] = [
  {
    icon: 'console',
    title: translate({id: 'home.quick.apiref.title', message: 'Referencia de la API'}),
    desc: translate({id: 'home.quick.apiref.desc', message: 'Explora y prueba cada endpoint en vivo.'}),
    href: '/docs/saas/api-reference-index',
  },
  {
    icon: 'launch',
    title: translate({id: 'home.quick.start.title', message: 'Primeros pasos'}),
    desc: translate({id: 'home.quick.start.desc', message: 'Haz tu primera llamada autenticada.'}),
    href: '/docs/saas/1platform-api/getting-started',
  },
  {
    icon: 'share',
    title: translate({id: 'home.quick.flows.title', message: 'Flujos de integración'}),
    desc: translate({id: 'home.quick.flows.desc', message: 'Flujos de trabajo de punta a punta, paso a paso.'}),
    href: '/docs/saas/1platform-api/flows/generate-invoice',
  },
  {
    icon: 'bell',
    title: translate({id: 'home.quick.webhooks.title', message: 'Webhooks'}),
    desc: translate({id: 'home.quick.webhooks.desc', message: 'Reacciona a los eventos en el momento en que ocurren.'}),
    href: '/docs/saas/1platform-api/webhooks/overview',
  },
];

function CardGrid({cards, columns}: {cards: Card[]; columns: 2 | 3}): ReactNode {
  return (
    <div className={columns === 2 ? styles.grid2 : styles.grid3}>
      {cards.map((c) => (
        <Link key={c.href} className={`${styles.card} homeCard`} to={c.href}>
          <span className={styles.cardIcon}>
            <Icon name={c.icon} size={20} />
          </span>
          <div className={styles.cardTitle}>{c.title}</div>
          <p className={styles.cardDesc}>{c.desc}</p>
          <span className={styles.cardCue} aria-hidden="true">
            <Icon name="arrow-right" size={14} />
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
