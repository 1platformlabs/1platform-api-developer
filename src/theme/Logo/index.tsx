import {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './styles.module.css';

/**
 * Swizzled Logo — the brand mark shared with 1platform.pro.
 *
 * Keep the approved white tile, blue numeral and Manrope wordmark aligned with
 * the marketing website. Spacing and responsive dimensions live in its CSS
 * module; destinations come from the portal's configured website origin.
 */
export default function Logo({className = ''}: {className?: string}): ReactNode {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const navbar = ref.current?.closest<HTMLElement>('.navbar');
    if (!navbar) return undefined;
    const update = () => {navbar.dataset.scrolled = String(window.scrollY > 30);};
    update();
    window.addEventListener('scroll', update, {passive: true});
    return () => window.removeEventListener('scroll', update);
  }, []);
  const {siteConfig} = useDocusaurusContext();
  return (
    <Link target="_self" ref={ref} to={`${String(siteConfig.customFields?.websiteUrl)}/es/`} className={`navbar__brand ${styles.logo} ${className}`} aria-label="1Platform, inicio">
      <span className={styles.logoMark} aria-hidden="true">
        1
      </span>
      <span className={styles.logoText}>Platform</span>
    </Link>
  );
}
