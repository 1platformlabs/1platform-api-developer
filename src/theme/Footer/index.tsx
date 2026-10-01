import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Logo from '@theme/Logo';
import styles from './styles.module.css';

export default function Footer(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const website = String(siteConfig.customFields?.websiteUrl);
  return <footer className={styles.footer}>
    <div className={`brand-wrap ${styles.main}`}>
      <div><Logo /><p>Infraestructura para crear y conectar soluciones</p></div>
      <nav className={styles.column} aria-label="Explorar"><h2>EXPLORE</h2>
        <Link target="_self" to={`${website}/es/#capacidades`}>Soluciones</Link>
        <Link target="_self" to={`${website}/es/#arquitectura`}>Infraestructura</Link>
        <Link target="_self" to={`${website}/es/#inteligencia`}>IA</Link>
      </nav>
      <nav className={styles.column} aria-label="Recursos"><h2>RECURSOS</h2>
        <Link target="_self" to="/docs/saas/1platform-api/getting-started">Documentación</Link>
        <Link target="_self" to={`${website}/es/blog/`}>Blog</Link>
        <Link target="_self" to="/api-reference/1platform-api">Referencia API</Link>
      </nav>
      <nav className={styles.column} aria-label="1Platform"><h2>1PLATFORM</h2>
        <Link target="_self" to={String(siteConfig.customFields?.contactUrl)}>Contacto</Link>
      </nav>
    </div>
    <div className={`brand-wrap ${styles.bottom}`}>
      <span>© {new Date().getFullYear()} 1Platform Labs</span>
      <nav aria-label="Información legal"><Link target="_self" to={`${website}/es/terminos/`}>Términos</Link><Link target="_self" to={`${website}/es/privacidad/`}>Privacidad</Link><Link target="_self" to={`${website}/es/cookies/`}>Cookies</Link></nav>
    </div>
  </footer>;
}
