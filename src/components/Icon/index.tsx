import type {ReactNode} from 'react';

import {iconPaths, type IconName} from './icons';

interface Props {
  name: IconName;
  /** Rendered size in px. */
  size?: number;
  className?: string;
}

/**
 * Renders one icon from the shared set. See `icons.ts` for the registry and the
 * reasoning behind having exactly one.
 *
 * Icons here are always decorative: they repeat a label that is already present
 * as text, so they are hidden from assistive tech and taken out of the tab
 * order. If an icon ever needs to carry meaning on its own, give it a real
 * accessible name at the call site instead of loosening this.
 */
export default function Icon({name, size = 24, className}: Props): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      // The registry holds static author-controlled path markup, never user input.
      dangerouslySetInnerHTML={{__html: iconPaths[name]}}
    />
  );
}

export {type IconName, toIconName} from './icons';
