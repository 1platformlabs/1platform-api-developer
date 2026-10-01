import type {ReactNode} from 'react';
import OriginalLink from '@theme-original/DocSidebarItem/Link';
import type {Props} from '@theme/DocSidebarItem/Link';

import Icon, {toIconName} from '@site/src/components/Icon';
import styles from '../Category/styles.module.css';

/**
 * Wrap, not eject: a top-level doc that declares `sidebar_custom_props.icon`
 * (Inicio, Inicio rápido) renders with the same icon + title + description as
 * the product categories, so the first entries of the sidebar read as one list.
 * Every other link is the stock component, untouched.
 */
export default function DocSidebarItemLink(props: Props): ReactNode {
  const cp = (props.item.customProps ?? {}) as Record<string, unknown>;
  const icon = toIconName(cp.icon);
  if (!icon || props.level !== 1) return <OriginalLink {...props} />;
  const description = typeof cp.description === 'string' ? cp.description : undefined;
  const label = (
    <span className={styles.richLabel}>
      <span className={styles.richIcon}><Icon name={icon} size={18} /></span>
      <span className={styles.richText}>
        <span className={styles.richTitle}>{props.item.label}</span>
        {description ? <span className={styles.richDesc} aria-hidden="true">{description}</span> : null}
      </span>
    </span>
  );
  return <OriginalLink {...props} item={{...props.item, label: label as unknown as string}} />;
}
