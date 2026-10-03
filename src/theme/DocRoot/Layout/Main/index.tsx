import type {ReactNode} from 'react';
import OriginalMain from '@theme-original/DocRoot/Layout/Main';
import type {Props} from '@theme/DocRoot/Layout/Main';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';

/** The visible mobile entry opens Docusaurus's real contextual sidebar. */
export default function DocRootMain(props: Props): ReactNode {
  const sidebar = useNavbarMobileSidebar();
  return <OriginalMain {...props}>
    <button className="docs-sections-toggle" type="button" aria-expanded={sidebar.shown} onClick={sidebar.toggle}>
      Secciones de la documentación
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {props.children}
  </OriginalMain>;
}
