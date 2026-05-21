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
    title: 'Solutions',
    links: [
      {label: 'Online Store', href: `${WEBSITE}/solutions/online-store/`},
      {label: 'Website Builder', href: `${WEBSITE}/solutions/website/`},
      {label: 'AI Content', href: `${WEBSITE}/solutions/content/`},
      {label: 'Whitelabel Dashboard', href: `${WEBSITE}/solutions/whitelabel/`},
      {label: 'Payments & Invoicing', href: `${WEBSITE}/payments-invoicing/`},
      {label: 'For Agencies', href: `${WEBSITE}/for-agencies/`},
      {label: 'For Developers', href: `${WEBSITE}/for-developers/`},
      {label: 'All Solutions', href: `${WEBSITE}/solutions/`},
    ],
  },
  {
    title: 'Resources',
    links: [
      {label: 'Documentation', href: `${DEVELOPER}/`},
      {label: 'API Reference', href: `${DEVELOPER}/api-docs`},
      {label: 'Code Examples', href: `${DEVELOPER}/`},
      {label: 'Blog', href: `${WEBSITE}/blog/`},
      {label: 'Changelog', href: `${WEBSITE}/changelog/`},
    ],
  },
  {
    title: 'Company',
    links: [
      {label: 'About', href: `${WEBSITE}/about/`},
      {label: 'For Developers', href: `${WEBSITE}/for-developers/`},
      {label: 'Pricing', href: `${WEBSITE}/pricing/`},
    ],
  },
  {
    title: 'Legal',
    links: [
      {label: 'Terms of Service', href: `${WEBSITE}/terms/`},
      {label: 'Privacy Policy', href: `${WEBSITE}/privacy/`},
      {label: 'Cookie Policy', href: `${WEBSITE}/cookies/`},
    ],
  },
];

export default function Footer(): ReactNode {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Stop Juggling 6 Different Services</h2>
          <p className={styles.ctaLead}>
            Start with one platform. Sell online, issue invoices, and publish content — all from one dashboard, one API, one bill.
          </p>
          <div className={styles.ctaActions}>
            <Link to={`${APP}/app/?intent=store`} className={styles.btnPrimary}>
              Launch Your Store
            </Link>
            <Link to={`${DEVELOPER}/`} className={styles.btnGhost}>
              View Documentation
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
          <p>&copy; {year} 1Platform Labs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
