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
    description: 'Step-by-step flow to issue an electronic invoice (FEL) via 1Platform API, registered in the Guatemalan tax system through TribuTax.',
    href: '/docs/flows/generate-invoice',
    primary: false,
  },
  {
    icon: '👤',
    title: 'User Onboarding',
    description: 'Step-by-step flow to register a new user, authenticate, and retrieve their profile via the 1Platform API.',
    href: '/docs/flows/user-onboarding',
    primary: false,
  },
  {
    icon: '📋',
    title: 'Activity Logs',
    description: 'Step-by-step flow to list, inspect, register, and clear API activity logs via the 1Platform API.',
    href: '/docs/flows/activity-logs',
    primary: false,
  },
  {
    icon: '🤖',
    title: 'AI Agents',
    description: 'Step-by-step flow to browse the agent catalog, create agents via wizard or API, trigger runs, monitor execution, and handle human-in-the-loop actions via the 1Platform API.',
    href: '/docs/flows/ai-agents',
    primary: false,
  },
  {
    icon: '🎭',
    title: 'AI Generations',
    description: 'Step-by-step flow to generate fictional comments, AI images, and profile cards via the 1Platform API.',
    href: '/docs/flows/ai-generations',
    primary: false,
  },
  {
    icon: '🔗',
    title: 'External Integrations',
    description: 'Step-by-step flow to connect websites with Google Search Console and the link-building marketplace via the 1Platform API.',
    href: '/docs/flows/external-integrations',
    primary: false,
  },
  {
    icon: '✨',
    title: 'Generate AI Content',
    description: 'Step-by-step flow to extract keywords, generate AI-powered content, and submit URLs for Google indexing via the 1Platform API.',
    href: '/docs/flows/generate-ai-content',
    primary: false,
  },
  {
    icon: '📊',
    title: 'Google Analytics',
    description: 'Step-by-step flow to connect Google Analytics 4, provision properties, install tracking, view metrics, and send server-side events via the 1Platform API.',
    href: '/docs/flows/google-analytics',
    primary: false,
  },
  {
    icon: '🌐',
    title: 'Manage Websites',
    description: 'Step-by-step flow to register, update, search, delete websites, and generate legal pages via the 1Platform API.',
    href: '/docs/flows/manage-websites',
    primary: false,
  },
  {
    icon: '💳',
    title: 'Payments & Subscriptions',
    description: 'Step-by-step flow to check billing, create payment transactions, view transaction history, and check subscription details via the 1Platform API.',
    href: '/docs/flows/payments-and-subscriptions',
    primary: false,
  },
  {
    icon: '💰',
    title: 'Google AdSense',
    description: 'Step-by-step flow to connect Google AdSense, view earnings, manage sites, handle alerts and policy issues via the 1Platform API.',
    href: '/docs/flows/google-adsense',
    primary: false,
  },
  {
    icon: '🌍',
    title: 'Domain Management',
    description: 'Step-by-step flow to check domain availability, register domains, manage DNS records, nameservers, transfers, and renewals via the 1Platform API.',
    href: '/docs/flows/domain-management',
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
