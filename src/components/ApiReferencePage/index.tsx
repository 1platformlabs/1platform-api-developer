import {useEffect, useRef, useState, type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {operationAliases, type OpenApi} from './operation-aliases';

interface ReferenceInstance {destroy(): void}
interface ReferenceRuntime {createApiReference(element: Element, configuration: Record<string, unknown>): ReferenceInstance}
interface Props {route: {cdn?: string; id?: string; label?: string; configuration: Record<string, unknown>}}


export default function ApiReferencePage({route}: Props): ReactNode {
  const mount = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const atlas = route.id === 'atlas-api';
  const guide = atlas ? '/docs/saas/atlas-api/quickstart' : '/docs/saas/1platform-api/inicio-rapido';
  useEffect(() => {
    const abort = new AbortController();
    let reference: ReferenceInstance | undefined;
    let script: HTMLScriptElement | undefined;
    let cancelScript: (() => void) | undefined;
    let alive = true;
    setState('loading');
    const init = async () => {
      const browser = window as unknown as {Scalar?: ReferenceRuntime};
      if (!browser.Scalar && route.cdn) {
        await new Promise<void>((resolve, reject) => {
          script = document.createElement('script');
          script.src = route.cdn!;
          script.async = true;
          const clearHandlers = () => {
            if (script) {script.onload = null; script.onerror = null;}
            cancelScript = undefined;
          };
          script.onload = () => {clearHandlers(); resolve();};
          script.onerror = () => {clearHandlers(); script?.remove(); reject(new Error('Reference runtime unavailable'));};
          cancelScript = () => {
            clearHandlers();
            script?.remove();
            reject(new Error('Reference route unloaded'));
          };
          document.head.appendChild(script);
        });
      }
      const runtime = browser.Scalar;
      if (!alive || !runtime || !mount.current) throw new Error('Reference runtime unavailable');
      const response = await fetch(String(route.configuration.url), {signal: abort.signal});
      if (!response.ok) throw new Error('OpenAPI unavailable');
      const spec: OpenApi = await response.json();
      if (!spec.paths || !alive) throw new Error('OpenAPI has no operations');
      const aliases = operationAliases(spec);
      const {url: _url, ...configuration} = route.configuration;
      reference = runtime.createApiReference(mount.current, {
        ...configuration,
        content: spec,
        redirect: (hash: string) => aliases.get(hash) ?? null,
        onLoaded: () => {if (alive) setState('ready');},
      });
    };
    void init().catch(() => {if (alive) setState('error');});
    return () => {
      alive = false;
      abort.abort();
      cancelScript?.();
      script?.remove();
      reference?.destroy();
    };
  }, [route.configuration, route.cdn, attempt]);
  return <Layout title={atlas ? 'Referencia Atlas API' : 'Referencia API'} description="Explore los endpoints, parámetros, esquemas y respuestas de la API">
    <main className="api-reference-page">
      <section className="reference-intro brand-wrap">
        <div><p className="eyebrow">DOCUMENTACIÓN · {atlas ? 'ATLAS' : '1PLATFORM'}</p>
          <h1>{atlas ? 'Referencia Atlas API' : 'Referencia API'}</h1>
          <p>{atlas ? 'Entrega de contenido, dentro de su producto' : 'Los servicios de 1Platform, dentro de su producto'}</p>
        </div>
        <nav className="reference-tabs" aria-label="Documentación técnica"><Link to={guide}>Primeros pasos</Link><a href={atlas ? '/api-reference/atlas-api' : '/api-reference/1platform-api'} aria-current="page">Referencia API</a></nav>
      </section>
      {state === 'loading' && <p className="reference-status brand-wrap" role="status">Cargando referencia interactiva</p>}
      {state === 'error' && <div className="reference-error brand-wrap" role="alert"><h2>No se pudo cargar la referencia</h2><p>Compruebe su conexión y vuelva a intentarlo</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Volver a cargar</button></div>}
      <div className="scalar-reference brand-wrap" ref={mount} />
      <noscript><p className="brand-wrap">Active JavaScript para explorar la referencia interactiva. También puede <a href={String(route.configuration.url)}>descargar el contrato OpenAPI</a>.</p></noscript>
    </main>
  </Layout>;
}
