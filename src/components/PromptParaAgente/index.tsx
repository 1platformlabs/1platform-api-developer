import {lazy, Suspense, type ReactNode} from 'react';

import styles from './styles.module.css';

/**
 * The MDX pages import THIS stub, not the implementation. Six pages use the
 * block; imported directly, webpack inlined the component and the whole icon
 * registry into each of their chunks (measured +16.8 KiB gzip over the
 * 470 KiB total). Behind `lazy()` the implementation is one shared chunk,
 * fetched only on a page that shows the block.
 *
 * The fallback is what the server renders and what a reader without JavaScript
 * keeps: the title, a disabled Copy and the link to the raw file.
 */
const Prompt = lazy(() => import('./Prompt'));

function Fallback({slug, title}: Readonly<{slug: string; title: string}>): ReactNode {
  return (
    <section className={styles.block} aria-label={title}>
      <div className={styles.head}>
        <p className={styles.title}>{title}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.button} disabled>
            Copiar
          </button>
          <a className={styles.raw} href={`/prompts/${slug}.md`}>
            Ver como texto
          </a>
        </div>
      </div>
      <p className={styles.note}>Cargando el prompt…</p>
    </section>
  );
}

export default function PromptParaAgente({slug, title = 'Prompt para su agente'}: Readonly<{slug: string; title?: string}>): ReactNode {
  return (
    <Suspense fallback={<Fallback slug={slug} title={title} />}>
      <Prompt slug={slug} title={title} />
    </Suspense>
  );
}
