import type {ReactNode} from 'react';
import {Redirect} from '@docusaurus/router';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/** Static hosts also redirect without JavaScript; cPanel distributes an HTTP 301. */
export default function Home(): ReactNode {
  const target = useBaseUrl('/docs/saas/1platform-api/getting-started');
  const {siteConfig} = useDocusaurusContext();
  const canonical = `${siteConfig.url}${target}`;
  return <>
    <Head>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <link rel="canonical" href={canonical} />
    </Head>
    <Redirect to={target} />
  </>;
}
