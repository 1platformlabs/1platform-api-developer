import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

// MUST stay in sync with 1platform-website/src/components/Footer.astro.
// If you add, remove, or reorder an item here, mirror it on the website.

type FooterLink = {label: string; href: string};
type FooterColumn = {title: string; links: FooterLink[]};

const WEBSITE = 'https://1platform.pro';
const DEVELOPER = 'https://developer.1platform.pro';
const APP = 'https://app.1platform.pro';

const columns: FooterColumn[] = [
  {
    title: 'Soluciones',
    links: [
      {label: 'Tienda online', href: `${WEBSITE}/solutions/online-store/`},
      {label: 'Creador de sitios web', href: `${WEBSITE}/solutions/website/`},
      {label: 'Contenido con IA', href: `${WEBSITE}/solutions/content/`},
      {label: 'Panel white-label', href: `${WEBSITE}/solutions/whitelabel/`},
      {label: 'Pagos y facturación', href: `${WEBSITE}/payments-invoicing/`},
      {label: 'Para agencias', href: `${WEBSITE}/for-agencies/`},
      {label: 'Para desarrolladores', href: `${WEBSITE}/for-developers/`},
      {label: 'Todas las soluciones', href: `${WEBSITE}/solutions/`},
    ],
  },
  {
    title: 'Recursos',
    links: [
      {label: 'Documentación', href: `${DEVELOPER}/`},
      {label: 'Referencia de la API', href: `${DEVELOPER}/api-docs`},
      {label: 'Ejemplos de código', href: `${DEVELOPER}/`},
      {label: 'Blog', href: `${WEBSITE}/blog/`},
      {label: 'Changelog', href: `${WEBSITE}/changelog/`},
    ],
  },
  {
    title: 'Empresa',
    links: [
      {label: 'Acerca de', href: `${WEBSITE}/about/`},
      {label: 'Para desarrolladores', href: `${WEBSITE}/for-developers/`},
      {label: 'Precios', href: `${WEBSITE}/pricing/`},
    ],
  },
  {
    title: 'Legal',
    links: [
      {label: 'Términos del servicio', href: `${WEBSITE}/terms/`},
      {label: 'Política de privacidad', href: `${WEBSITE}/privacy/`},
      {label: 'Política de cookies', href: `${WEBSITE}/cookies/`},
    ],
  },
];

export default function Footer(): ReactNode {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Deja de hacer malabares con 6 servicios distintos</h2>
          <p className={styles.ctaLead}>
            Empieza con una sola plataforma. Vende en línea, emite facturas y publica contenido, todo desde un panel, una API y una sola factura.
          </p>
          <div className={styles.ctaActions}>
            <Link to={`${APP}/app/?intent=store`} className={styles.btnPrimary}>
              Lanza tu tienda
            </Link>
            <Link to={`${DEVELOPER}/`} className={styles.btnGhost}>
              Ver documentación
            </Link>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.links}>
          <div className={styles.brand}>
            <Link to={WEBSITE} className={styles.brandLogo} aria-label="1Platform">
              <span className={styles.brandLogo1}>1</span>
              <span className={styles.brandLogoText}>Platform</span>
            </Link>
            <p className={styles.brandTag}>One platform. Every solution.</p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className={styles.col}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul className={styles.colList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className={styles.colLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <p>&copy; {year} 1Platform Labs. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
