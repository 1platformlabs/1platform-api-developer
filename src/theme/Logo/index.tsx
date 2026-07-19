import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './styles.module.css';

/**
 * Swizzled Logo — the brand mark shared with 1platform.pro.
 *
 * MUST stay in sync with 1platform-website/src/components/Logo.astro: a visitor
 * arriving from the marketing site sees this first, and any drift here reads as
 * "different product". The "1" is a cobalt node, not blue text.
 *
 * JSX collapses the whitespace between the two spans (it contains a newline),
 * so the only separation is the 0.36em gap set in CSS — same as the site.
 */
export default function Logo(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Link to="/" className={`navbar__brand ${styles.logo}`} aria-label={siteConfig.title}>
      <span className={styles.logoMark} aria-hidden="true">
        1
      </span>
      <span className={styles.logoText}>Platform</span>
    </Link>
  );
}
