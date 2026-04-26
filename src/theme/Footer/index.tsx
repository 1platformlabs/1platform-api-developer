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
      {label: 'AI Keywords', href: `${WEBSITE}/solutions/#intelligence`},
      {label: 'AI Content', href: `${WEBSITE}/solutions/#content`},
      {label: 'AI Images', href: `${WEBSITE}/solutions/#content`},
      {label: 'CMS Publishing', href: `${WEBSITE}/solutions/#distribution`},
      {label: 'Indexing', href: `${WEBSITE}/solutions/#distribution`},
      {label: 'Link Building', href: `${WEBSITE}/solutions/#distribution`},
      {label: 'Payments', href: `${WEBSITE}/solutions/#payments`},
      {label: 'Invoicing (FEL)', href: `${WEBSITE}/solutions/#payments`},
      {label: 'Website Management', href: `${WEBSITE}/solutions/#intelligence`},
      {label: 'Domain Management', href: `${WEBSITE}/solutions/#distribution`},
      {label: 'Analytics', href: `${WEBSITE}/solutions/#intelligence`},
      {label: 'AI Agents', href: `${WEBSITE}/solutions/#automation`},
      {label: 'Ad Revenue', href: `${WEBSITE}/solutions/#intelligence`},
      {label: 'Activity Logs', href: `${WEBSITE}/solutions/#automation`},
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
      {label: 'Why 1Platform', href: `${WEBSITE}/why-1platform/`},
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
          <h2 className={styles.ctaTitle}>Stop Managing 19+ Different Tools</h2>
          <p className={styles.ctaLead}>
            Start with one platform. From keyword research to published, indexed content — all in one API.
          </p>
          <div className={styles.ctaActions}>
            <Link to={APP} className={styles.btnPrimary}>
              Get Started Free
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
