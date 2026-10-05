import {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

/**
 * Swizzled Logo — the brand mark shared with 1platform.pro.
 *
 * Use the unchanged digital v2 artwork shared with the marketing website.
 * Its CSS module frames the transparent margins and makes the mark white on
 * the dark navbar/footer; destinations come from the configured website origin.
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
  const logoUrl = useBaseUrl('/img/brand/1platform-logo-v2-digital.png');
  return (
    <Link target="_self" ref={ref} to={`${String(siteConfig.customFields?.websiteUrl)}/es/`} className={`navbar__brand ${styles.logo} ${className}`} aria-label="1Platform, inicio">
      <span className={styles.logoFrame} aria-hidden="true">
        <img className={styles.logoImage} src={logoUrl} alt="" width={2042} height={770} />
      </span>
    </Link>
  );
}
