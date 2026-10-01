import type {ReactNode} from 'react';
import OriginalLayout from '@theme-original/DocRoot/Layout';
import type {Props} from '@theme/DocRoot/Layout';
import {useLocation} from '@docusaurus/router';

export default function DocRootLayout(props: Props): ReactNode {
  const {pathname} = useLocation();
  const entry = /\/docs\/saas\/1platform-api\/getting-started\/?$/.test(pathname);
  return <div className={entry ? 'docs-entry' : 'docs-reading'}>
    {entry && <section className="docs-masthead" aria-labelledby="getting-started-title">
      <img src="/img/docs-infrastructure.webp" alt="" fetchPriority="high" />
      <div className="brand-wrap"><p className="eyebrow">DOCUMENTACIÓN · 1PLATFORM API</p>
        <h1 id="getting-started-title">Primeros pasos</h1><p>Autenticación, entornos y primera llamada a la API</p>
      </div>
    </section>}
    <OriginalLayout {...props} />
  </div>;
}
