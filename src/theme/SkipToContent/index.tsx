import {useEffect} from 'react';
import type {ReactNode} from 'react';
import OriginalSkipToContent from '@theme-original/SkipToContent';
import {SkipToContentFallbackId} from '@docusaurus/theme-common/internal';

const SKIP_LINK = `a[href="#${SkipToContentFallbackId}"]`;

/** Upstream focuses `<main>` and drops its tabindex in the same tick, which
 * blurs it in Chromium: focus lands on BODY and, on mobile, the next Tab hits
 * the sections toggle. A document listener runs after React's own handler
 * (bubbling past the root) and keeps the reading content focused. */
function focusContent(event: MouseEvent): void {
  if (!(event.target instanceof Element) || !event.target.closest(SKIP_LINK)) return;
  const target = document.querySelector<HTMLElement>('main article')
    ?? document.querySelector<HTMLElement>('main')
    ?? document.getElementById(SkipToContentFallbackId);
  if (!target) return;
  target.setAttribute('tabindex', '-1');
  target.focus();
}

export default function SkipToContent(): ReactNode {
  useEffect(() => {
    document.addEventListener('click', focusContent);
    return () => document.removeEventListener('click', focusContent);
  }, []);
  return <OriginalSkipToContent />;
}
