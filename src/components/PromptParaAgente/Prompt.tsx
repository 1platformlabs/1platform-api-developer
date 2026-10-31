import {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';

import Icon from '@site/src/components/Icon';
import styles from './styles.module.css';

/**
 * «Prompt para su agente» (épica infraestructura-para-agentes-ia, D-4).
 *
 * The text lives in `static/prompts/<slug>.md` and is fetched when the block
 * scrolls into view, so it never enters the JS bundle (the total budget has a
 * few KiB of room) and is the same file in `docusaurus start` and in the build.
 * It renders in <pre><code>, which keeps it out of the editorial-tone gate: it
 * is an instruction for a program, not prose for a reader.
 *
 * Copy writes the text already loaded, synchronously inside the gesture — an
 * `await` before `writeText` loses the user activation in some browsers. Until
 * the text loads the button is disabled; if loading fails there is a retry and
 * the raw link, which is also what a reader without JavaScript gets.
 */
type State = {status: 'idle' | 'loading' | 'error'} | {status: 'ready'; text: string};

export default function Prompt({slug, title}: Readonly<{slug: string; title: string}>): ReactNode {
  const href = `/prompts/${slug}.md`;
  const root = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>({status: 'idle'});
  const [announcement, setAnnouncement] = useState('');
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The message is visible, not only announced: a sighted reader who clicks
  // Copiar needs to see that it worked, or that it did not and what to do. It
  // clears itself so a second click is announced again.
  const announce = useCallback((message: string) => {
    clearTimeout(clearTimer.current);
    setAnnouncement(message);
    clearTimer.current = setTimeout(() => setAnnouncement(''), 4000);
  }, []);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  const load = useCallback(() => {
    setState({status: 'loading'});
    fetch(href)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then((text) => setState({status: 'ready', text}))
      .catch(() => setState({status: 'error'}));
  }, [href]);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      load();
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, {rootMargin: '200px'});
    observer.observe(node);
    return () => observer.disconnect();
  }, [load]);

  const copy = () => {
    if (state.status !== 'ready') return;
    if (!navigator.clipboard) {
      announce('No se pudo copiar. Seleccione el texto y cópielo.');
      return;
    }
    navigator.clipboard.writeText(state.text).then(
      () => announce('Copiado'),
      () => announce('No se pudo copiar. Seleccione el texto y cópielo.'),
    );
  };

  return (
    <section ref={root} className={styles.block} aria-label={title}>
      <div className={styles.head}>
        <p className={styles.title}>{title}</p>
        <div className={styles.actions}>
          {state.status === 'error' ? (
            <button type="button" className={styles.button} onClick={load}>
              Reintentar
            </button>
          ) : (
            <button type="button" className={styles.button} onClick={copy} disabled={state.status !== 'ready'}>
              <Icon name="copy" size={16} />
              Copiar
            </button>
          )}
          <a className={styles.raw} href={href}>
            Ver como texto
          </a>
        </div>
      </div>
      <p className={styles.status} aria-live="polite" hidden={state.status !== 'ready'}>
        {announcement}
      </p>
      {state.status === 'ready' ? (
        <pre className={styles.code} tabIndex={0}>
          <code>{state.text}</code>
        </pre>
      ) : (
        <p className={styles.note} role={state.status === 'error' ? 'alert' : 'status'}>
          {state.status === 'error' ? 'No se pudo cargar el prompt.' : 'Cargando el prompt…'}
        </p>
      )}
    </section>
  );
}
