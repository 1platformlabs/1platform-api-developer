import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';

import Icon, {toIconName, type IconName} from '@site/src/components/Icon';
import styles from './styles.module.css';

/**
 * The home (Inicio) grids, modelled on a payments developer portal: products on
 * the left, shortcuts on the right.
 *
 * SINGLE SOURCE FOR THE PRODUCTS: the sidebar. Each product folder's
 * `_category_.json` declares `customProps.{kind:'product', icon, description}`,
 * and this grid reads exactly those categories, in sidebar order. A product
 * added, renamed or re-described there shows up here with the same words — the
 * grid cannot drift from the navigation because it has no copy of its own.
 */
type Card = {icon: IconName; title: string; desc: string; href: string};

function productsFrom(items: PropSidebarItem[]): Card[] {
  const out: Card[] = [];
  for (const item of items) {
    // A product folder with a single page is collapsed by Docusaurus into a plain
    // link (its index doc), keeping the category's customProps — so both shapes
    // are products.
    if ((item.type !== 'category' && item.type !== 'link') || !item.href) continue;
    const cp = (item.customProps ?? {}) as Record<string, unknown>;
    const icon = toIconName(cp.icon);
    if (cp.kind !== 'product' || !icon) continue;
    out.push({icon, title: item.label, desc: String(cp.description ?? ''), href: item.href});
  }
  return out;
}

function CardLink({card, compact}: {card: Card; compact?: boolean}): ReactNode {
  return (
    <Link className={`${compact ? styles.quick : styles.card} homeCard`} to={card.href}>
      <span className={styles.cardIcon}>
        <Icon name={card.icon} size={20} />
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{card.title}</span>
        <span className={styles.cardDesc}>{card.desc}</span>
      </span>
    </Link>
  );
}

export function ProductCards(): ReactNode {
  const sidebar = useDocsSidebar();
  const products = productsFrom(sidebar?.items ?? []);
  return (
    <div className={styles.products}>
      {products.map((c) => (
        <CardLink key={c.href} card={c} />
      ))}
    </div>
  );
}

export function QuickCards(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const website = String(siteConfig.customFields?.websiteUrl ?? 'https://1platform.pro');
  const quick: Card[] = [
    {icon: 'launch', title: 'Inicio rápido', desc: 'Sus credenciales y su primera llamada autenticada.', href: '/docs/saas/1platform-api/inicio-rapido'},
    {icon: 'code', title: 'Referencia de API', desc: 'Explore endpoints y esquemas, y pruébelos en vivo.', href: '/api-reference/1platform-api'},
    {icon: 'clock', title: 'Cambios', desc: 'Lanzamientos, cambios incompatibles y novedades.', href: `${website}/es/novedades/`},
    {icon: 'support', title: 'Soporte', desc: 'Hable con el equipo de integraciones.', href: `${website}/es/contacto/`},
  ];
  return (
    <div className={styles.quickList}>
      {quick.map((c) => (
        <CardLink key={c.href} card={c} compact />
      ))}
    </div>
  );
}
