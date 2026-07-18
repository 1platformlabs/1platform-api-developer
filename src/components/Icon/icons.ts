/**
 * The icon set — one strategy, one visual language.
 *
 * 24x24, 1.5 stroke, currentColor. Every icon in this portal comes from here.
 * Before this, emoji stood in as icons in the sidebar, the landing cards and
 * the category configs, sitting on pastel tiles that encoded product identity
 * in colour alone.
 *
 * The paths are copied verbatim from 1platform-website/src/components/icons.ts
 * so a concept is the SAME drawing on both domains — "dashboard" must not be
 * two different glyphs depending on which subdomain you are on. Only add an
 * icon here when the site's registry genuinely has no entry for the concept,
 * and then draw it in the same idiom (24x24, 1.5 stroke, round caps/joins).
 *
 * `mobile` is the one such addition: this portal documents a mobile app and
 * the marketing site has no phone glyph.
 */

export type IconName =
  | 'dashboard'
  | 'layers'
  | 'mobile'
  | 'code'
  | 'globe'
  | 'console'
  | 'launch'
  | 'share'
  | 'bell'
  | 'home'
  | 'arrow-right';

export const iconPaths: Record<IconName, string> = {
  dashboard:
    '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 7h20"/><path d="M7 12h2"/><path d="M11 12h6"/><path d="M7 15h10"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  // Not in the site registry — the site documents no mobile app. Same idiom.
  mobile: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/>',
  console:
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  launch:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
};

/**
 * Narrows an untrusted string (e.g. `customProps.icon` from a _category_.json,
 * which nothing type-checks) to a known icon.
 *
 * Returns undefined rather than throwing: a typo in a category config should
 * render without an icon, not fail the build. That is the whole degradation
 * contract for customProps.
 */
export function toIconName(value: unknown): IconName | undefined {
  return typeof value === 'string' && value in iconPaths ? (value as IconName) : undefined;
}
