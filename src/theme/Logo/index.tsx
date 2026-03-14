import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './styles.module.css';

export default function Logo(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Link to="/" className={styles.logo} aria-label={siteConfig.title}>
      <span className={styles.logo1}>1</span>
      <span className={styles.logoText}>Platform</span>
    </Link>
  );
}
