import {useEffect, type ReactNode} from 'react';
import {useLockBodyScroll, useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarLayout from '@theme/Navbar/MobileSidebar/Layout';
import NavbarMobileSidebarHeader from '@theme/Navbar/MobileSidebar/Header';
import NavbarMobileSidebarPrimaryMenu from '@theme/Navbar/MobileSidebar/PrimaryMenu';
import NavbarMobileSidebarSecondaryMenu from '@theme/Navbar/MobileSidebar/SecondaryMenu';

/**
 * Swizzled (wrap) Navbar/MobileSidebar — the panel the menu button opens.
 *
 * The site's header redesign hides the navigation links at EVERY width and
 * puts them behind the menu button (1platform-website, epic
 * home-landing-redesign, D-3/D-4). Mirroring that here with CSS alone is not
 * enough, and this file exists because that was measured rather than assumed:
 * Infima only HIDES `.navbar__toggle` above 996 px, which CSS can undo, but
 * `useNavbarMobileSidebar()` computes
 *
 *     shouldRender = !disabled && windowSize === 'mobile'
 *
 * so on a desktop viewport the stock component returns `null` and the forced
 * toggle would open nothing. The only line changed against the theme's own
 * `Navbar/MobileSidebar/index.js` is that gate: the panel renders whenever the
 * navbar has items, at any width. Everything else — the layout, the header
 * with its close button, the primary and secondary menus, the body scroll lock,
 * the Escape/back-button handling in the provider — is the theme's own code,
 * untouched. `Navbar` itself is NOT swizzled (the site's L-48c: that loses
 * landmarks and focus order).
 *
 * One addition the theme lacks and the site's panel has: Escape closes it.
 * Measured on the built portal — the stock sidebar stays open on Escape, and a
 * menu that a keyboard user can open but not dismiss is a trap.
 */
export default function NavbarMobileSidebar(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  useLockBodyScroll(mobileSidebar.shown);

  useEffect(() => {
    if (!mobileSidebar.shown) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        mobileSidebar.toggle();
        document.querySelector<HTMLElement>('.navbar__toggle')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileSidebar.shown, mobileSidebar.toggle]);

  if (mobileSidebar.disabled) {
    return null;
  }
  return (
    <NavbarMobileSidebarLayout
      header={<NavbarMobileSidebarHeader />}
      primaryMenu={<NavbarMobileSidebarPrimaryMenu />}
      secondaryMenu={<NavbarMobileSidebarSecondaryMenu />}
    />
  );
}
