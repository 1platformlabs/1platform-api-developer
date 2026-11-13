import {useEffect, useRef, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

/** Shared One Platform wordmark; preserve the original symbol artwork. */
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
  const logoUrl = useBaseUrl('/img/brand/one-platform-symbol.png');
  return (
    <Link target="_self" ref={ref} to={`${String(siteConfig.customFields?.websiteUrl)}/es/`} className={`navbar__brand ${styles.logo} ${className}`} aria-label="One Platform, inicio">
      <span className={styles.logoFrame} aria-hidden="true">
        <img className={styles.logoImage} src={logoUrl} alt="" width={1254} height={1254} />
      </span>
      <span className={styles.name}>One Platform</span>
    </Link>
  );
}
