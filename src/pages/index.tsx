import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import styles from './index.module.css';

const quickLinks = [
  {
    icon: '📡',
    title: 'API Reference',
    description: 'Explore every endpoint interactively. Test requests from the browser with live responses.',
    href: '/api-docs',
    primary: true,
  },
  {
    icon: '🧾',
    title: 'Generate Invoice (FEL)',
    description: 'Step-by-step guide for electronic invoicing in Guatemala with full code examples.',
    href: '/docs/flows/generate-invoice',
    primary: false,
  },
  {
    icon: '📄',
    title: 'OpenAPI Spec',
    description: 'Download the raw OpenAPI 3.1 specification for code generation or custom tooling.',
    href: 'pathname:///openapi.json',
    primary: false,
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Developer Docs"
      description="API documentation for 1Platform — e-commerce, delivery, payments, invoicing, and AI content via a unified REST API.">
      {/* Compact Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroBadge}>developer.1platform.pro</p>
          <h1 className={styles.heroTitle}>
            Explore the <span className={styles.heroAccent}>1Platform</span> API
          </h1>
          <p className={styles.heroSubtitle}>
            One REST API for e-commerce, delivery, payments, invoicing, and AI content.
            Authenticate, integrate, and ship.
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.primaryBtn} to="/api-docs">
              API Reference
            </Link>
            <Link className={styles.ghostBtn} to="/docs/flows/generate-invoice">
              Integration Flows
            </Link>
          </div>
        </div>
      </header>

      {/* Quick Links Grid */}
      <section className={styles.cards}>
        <div className={styles.cardsGrid}>
          {quickLinks.map((link) => (
            <Link key={link.title} className={styles.card} to={link.href}>
              <span className={styles.cardIcon} role="img" aria-hidden="true">{link.icon}</span>
              <h3 className={styles.cardTitle}>{link.title}</h3>
              <p className={styles.cardDesc}>{link.description}</p>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Auth Summary */}
      <section className={styles.authSection}>
        <div className={styles.authInner}>
          <h2 className={styles.authTitle}>Two-Token Authentication</h2>
          <p className={styles.authDesc}>
            Every request requires two headers: an <code>Authorization</code> app token
            and an <code>x-user-token</code> user token. Get both from your dashboard
            at <Link to="https://app.1platform.pro">app.1platform.pro</Link>.
          </p>
          <pre className={styles.authCode}>
            <code>{`curl -X GET https://api.1platform.pro/api/v1/keywords/extract \\
  -H "Authorization: Bearer YOUR_APP_TOKEN" \\
  -H "x-user-token: YOUR_USER_TOKEN" \\
  -H "Content-Type: application/json"`}</code>
          </pre>
        </div>
      </section>
    </Layout>
  );
}
