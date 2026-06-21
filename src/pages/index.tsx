import type {ReactNode} from 'react';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * This site is pure 1Platform documentation — the marketing home lives at
 * 1platform.pro. The root therefore has no standalone landing page; it simply
 * sends visitors straight into the docs entry. Keeping a real route at `/`
 * (instead of only a client-redirect) also keeps the brand logo's `to="/"`
 * link valid for the broken-link checker.
 *
 * `useBaseUrl` prepends the active locale's baseUrl, so Spanish visitors at
 * `/es/` land on `/es/docs/` rather than the English `/docs/`.
 */
export default function Home(): ReactNode {
  return <Redirect to={useBaseUrl('/docs/')} />;
}
