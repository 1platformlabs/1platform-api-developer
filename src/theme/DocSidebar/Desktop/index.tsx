import type {ReactNode} from 'react';
import OriginalSidebar from '@theme-original/DocSidebar/Desktop';
import type {Props} from '@theme/DocSidebar/Desktop';
export default function DocSidebarDesktop(props: Props): ReactNode {
  return <><p className="eyebrow docs-menu-title">DOCUMENTACIÓN</p><OriginalSidebar {...props} /></>;
}
