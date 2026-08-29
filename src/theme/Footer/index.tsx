import {useEffect, useRef, useState, type FormEvent, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Icon from '@site/src/components/Icon';

import styles from './styles.module.css';

// MUST stay in sync with 1platform-website/src/components/Footer.astro.
// If you add, remove, or reorder an item here, mirror it on the website.
//
// Redrawn with the site's home redesign (epic home-landing-redesign, LMW-10):
// a dark band, the brand as a watermark, one card with an e-mail sign-up on the
// left, three link columns on the right and a legal row under a hairline. The
// closing CTA is gone on both sides — the reference has none. The link SET is
// the site's, redistributed: PRODUCT = the seven solutions + the catch-all,
// COMPANY = company pages, pricing and blog, RESOURCES = the developer surface
// and the changelog, and the legal three in the bottom row.

type FooterLink = {label: string; href: string};
type FooterColumn = {key: string; title: string; links: FooterLink[]};

const WEBSITE = 'https://1platform.pro';
const DEVELOPER = 'https://developer.1platform.pro';

const columns: FooterColumn[] = [
  {
    key: 'product',
    title: 'Producto',
    links: [
      {label: 'Tienda online', href: `${WEBSITE}/solutions/online-store/`},
      {label: 'Creador de sitios web', href: `${WEBSITE}/solutions/website/`},
      {label: 'Contenido con IA', href: `${WEBSITE}/solutions/content/`},
      {label: 'Envíos', href: `${WEBSITE}/solutions/deliveries/`},
      {label: 'Publicidad', href: `${WEBSITE}/solutions/ads/`},
      {label: 'Panel white-label', href: `${WEBSITE}/solutions/whitelabel/`},
      {label: 'Pagos y facturación', href: `${WEBSITE}/payments-invoicing/`},
      {label: 'Todas las soluciones', href: `${WEBSITE}/solutions/`},
    ],
  },
  {
    key: 'company',
    title: 'Empresa',
    links: [
      {label: 'Acerca de', href: `${WEBSITE}/about/`},
      {label: 'Precios', href: `${WEBSITE}/pricing/`},
      {label: 'Para agencias', href: `${WEBSITE}/for-agencies/`},
      {label: 'Para desarrolladores', href: `${WEBSITE}/for-developers/`},
      {label: 'Blog', href: `${WEBSITE}/blog/`},
    ],
  },
  {
    key: 'resources',
    title: 'Recursos',
    links: [
      {label: 'Documentación', href: `${DEVELOPER}/`},
      {label: 'Referencia de la API', href: `${DEVELOPER}/api-docs`},
      {label: 'Ejemplos de código', href: `${DEVELOPER}/`},
      {label: 'Changelog', href: `${WEBSITE}/changelog/`},
    ],
  },
];

const legal: FooterLink[] = [
  {label: 'Términos del servicio', href: `${WEBSITE}/terms/`},
  {label: 'Política de privacidad', href: `${WEBSITE}/privacy/`},
  {label: 'Preferencias de cookies', href: `${WEBSITE}/cookies/`},
];

// Assembled at submit time, like the site's contact page, so the address is
// not a scrapeable literal in the HTML.
const MAIL_USER = 'sales';
const MAIL_DOMAIN = '1platform.pro';
const MAIL_SUBJECT = 'Quiero recibir las novedades de 1Platform';

/**
 * The columns fold into tappable headings on phones (the reference does); they
 * render OPEN so a browser without JavaScript shows every link, and only close
 * below 769 px once the script runs.
 */
function useFoldedOnPhones(): boolean {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setFolded(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return folded;
}

export default function Footer(): ReactNode {
  const year = new Date().getFullYear();
  const folded = useFoldedOnPhones();
  const [status, setStatus] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  // No list backend on either domain (site D-14): the sign-up composes a
  // mailto: in the browser. Without JavaScript the form takes the reader to
  // the site's contact page instead.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const from = emailRef.current?.value ?? '';
    setStatus('Abriendo tu aplicación de correo…');
    window.location.href = `mailto:${MAIL_USER}@${MAIL_DOMAIN}?subject=${encodeURIComponent(
      MAIL_SUBJECT,
    )}&body=${encodeURIComponent(from)}`;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.watermark} aria-hidden="true">
          <span className={styles.watermarkMark}>1</span>
          <span className={styles.watermarkText}>Platform</span>
        </div>

        <div className={styles.card}>
          <div className={styles.top}>
            <div className={styles.signup}>
              <h3 className={styles.signupTitle}>No te lo pierdas</h3>
              <p className={styles.signupBody}>Deja tu correo para recibir novedades</p>
              <form className={styles.form} method="get" action={`${WEBSITE}/contact/`} onSubmit={onSubmit}>
                <label htmlFor="footer-email" className={styles.srOnly}>
                  Correo electrónico
                </label>
                <input
                  id="footer-email"
                  ref={emailRef}
                  className={styles.input}
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="Escribe tu correo"
                />
                <button type="submit" className={styles.submit} aria-label="Enviar">
                  <Icon name="arrow-right" size={20} />
                </button>
              </form>
              <p className={styles.status} aria-live="polite">
                {status}
              </p>
            </div>

            <div className={styles.cols}>
              {columns.map((col) => (
                <details key={col.key} className={styles.col} open={!folded}>
                  <summary className={styles.colTitle}>
                    <span>{col.title}</span>
                    <span className={styles.colPlus} aria-hidden="true" />
                  </summary>
                  <ul className={styles.colList}>
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.href} className={styles.colLink}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>

          <div className={styles.bottom}>
            <p className={styles.copyright}>&copy; {year} 1Platform Labs. Todos los derechos reservados.</p>
            <ul className={styles.legal}>
              {legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className={styles.colLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
