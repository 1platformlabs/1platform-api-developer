import type {ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import OriginalTOC from '@theme-original/DocItem/TOC/Mobile';

export default function DocTOCMobile(): ReactNode {
  const {pathname} = useLocation();
  // The entry guide's four anchors are in the real contextual sidebar. Avoid a
  // second collapsed menu; other technical pages retain their native local TOC.
  if (/\/docs\/saas\/1platform-api\/getting-started\/?$/.test(pathname)) return null;
  return <OriginalTOC />;
}
