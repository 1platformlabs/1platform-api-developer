import type {ReactNode} from 'react';
import {Redirect, useLocation} from '@docusaurus/router';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/** Static hosts also redirect without JavaScript; cPanel distributes an HTTP 301.
 * The inline script runs before the meta refresh and keeps query and fragment,
 * as the HTTP 301 and the other client redirects of this site already do. */
export default function Home(): ReactNode {
  const target = useBaseUrl('/docs/saas/1platform-api/getting-started');
  const {siteConfig} = useDocusaurusContext();
  const {search, hash} = useLocation();
  const canonical = `${siteConfig.url}${target}`;
  return <>
    <Head>
      <script>{`window.location.replace(${JSON.stringify(target)}+window.location.search+window.location.hash);`}</script>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <link rel="canonical" href={canonical} />
    </Head>
    <Redirect to={{pathname: target, search, hash}} />
  </>;
}
