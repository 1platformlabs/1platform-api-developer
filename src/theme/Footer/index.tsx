import {useEffect, useRef, useState, type FormEvent, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Icon from '@site/src/components/Icon';
import Logo from '@theme/Logo';

import styles from './styles.module.css';

type FooterLink = {label: string; href: string};
type FooterColumn = {key: string; title: string; links: FooterLink[]};

const WEBSITE = 'https://1platform.pro';
const DEVELOPER = 'https://developer.1platform.pro';

// Keep this set and order aligned with 1platform-website/src/components/Footer.astro.
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
      {label: 'Panel de marca blanca', href: `${WEBSITE}/solutions/whitelabel/`},
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

const MAIL_USER = 'sales';
const MAIL_DOMAIN = '1platform.pro';
const MAIL_SUBJECT = 'Quiero recibir las novedades de 1Platform';

function useFoldedOnPhones(): boolean {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailRef.current?.value ?? '';
    setStatus('Abriendo tu aplicación de correo…');
    window.location.href = `mailto:${MAIL_USER}@${MAIL_DOMAIN}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(email)}`;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <Logo className={styles.brandLogo} />
          <p>Una plataforma. Todas las soluciones.</p>
          <Link className={styles.footerCta} to="https://app.1platform.pro/app/">
            Comenzar gratis
          </Link>
        </div>

        <div className={styles.content}>
          <div className={styles.signup}>
            <p className={styles.eyebrow}>Mantente al día</p>
            <h2>Recibe novedades de 1Platform.</h2>
            <form className={styles.form} method="get" action={`${WEBSITE}/contact/`} onSubmit={onSubmit}>
              <label htmlFor="footer-email" className={styles.srOnly}>Correo electrónico</label>
              <input id="footer-email" ref={emailRef} type="email" name="email" required autoComplete="email" placeholder="Escribe tu correo" />
              <button type="submit" aria-label="Enviar"><Icon name="arrow-right" size={18} /></button>
            </form>
            <p className={styles.status} aria-live="polite">{status}</p>
          </div>

          <div className={styles.columns}>
            {columns.map((column) => (
              <details key={column.key} className={styles.column} open={!folded}>
                <summary>
                  <span>{column.title}</span>
                  <span className={styles.columnPlus} aria-hidden="true" />
                </summary>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}><Link to={link.href}>{link.label}</Link></li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {year} 1Platform Labs. Todos los derechos reservados.</p>
          <ul>{legal.map((link) => <li key={link.label}><Link to={link.href}>{link.label}</Link></li>)}</ul>
        </div>
      </div>
    </footer>
  );
}
