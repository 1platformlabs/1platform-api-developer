import type {ReactNode} from 'react';
import OriginalLayout from '@theme-original/DocRoot/Layout';
import type {Props} from '@theme/DocRoot/Layout';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';

/** The home (Inicio) keeps the historical entry URL — every root, `/docs` and
 * retired-overview redirect of the server and the health checks point at it —
 * and is the only page that opens with the masthead. */
const HOME = /\/docs\/saas\/1platform-api\/getting-started\/?$/;

export default function DocRootLayout(props: Props): ReactNode {
  const {pathname} = useLocation();
  const entry = HOME.test(pathname);
  return <div className={entry ? 'docs-entry' : 'docs-reading'}>
    {entry && <section className="docs-masthead" aria-labelledby="getting-started-title">
      <img src="/img/docs-infrastructure.webp" alt="" fetchPriority="high" />
      <div className="brand-wrap"><p className="eyebrow">DOCUMENTACIÓN PARA DESARROLLADORES</p>
        <h1 id="getting-started-title">Documentación para desarrolladores de 1Platform</h1>
        <p>Todo lo que necesita para integrar 1Platform: autenticación, una API REST por producto, webhooks y guías paso a paso.</p>
        <div className="docs-masthead__actions">
          <Link className="docs-masthead__primary" to="/docs/saas/1platform-api/inicio-rapido">Empezar integración</Link>
          <Link className="docs-masthead__secondary" to="/api-reference/1platform-api">Referencia de API</Link>
        </div>
      </div>
    </section>}
    <OriginalLayout {...props} />
  </div>;
}
