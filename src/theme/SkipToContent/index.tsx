import type {ReactNode} from 'react';
import OriginalSkipToContent from '@theme-original/SkipToContent';
import {SkipToContentFallbackId} from '@docusaurus/theme-common/internal';

/** Upstream focuses `<main>` and drops its tabindex in the same tick, which
 * blurs it in Chromium: focus lands on BODY and, on mobile, the next Tab hits
 * the sections toggle. Runs after the original handler (bubbling) and keeps
 * the reading content focused so keyboard users actually skip the chrome. */
function focusContent(): void {
  const target = document.querySelector<HTMLElement>('main article')
    ?? document.querySelector<HTMLElement>('main')
    ?? document.getElementById(SkipToContentFallbackId);
  if (!target) return;
  target.setAttribute('tabindex', '-1');
  target.focus();
}

export default function SkipToContent(): ReactNode {
  return <div onClick={(event) => {
    if ((event.target as Element).closest('a')) focusContent();
  }}>
    <OriginalSkipToContent />
  </div>;
}
