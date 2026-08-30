import {useEffect, type ReactNode} from 'react';
import {useLockBodyScroll, useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarLayout from '@theme/Navbar/MobileSidebar/Layout';
import NavbarMobileSidebarHeader from '@theme/Navbar/MobileSidebar/Header';
import NavbarMobileSidebarPrimaryMenu from '@theme/Navbar/MobileSidebar/PrimaryMenu';
import NavbarMobileSidebarSecondaryMenu from '@theme/Navbar/MobileSidebar/SecondaryMenu';

/**
 * Swizzled (wrap) Navbar/MobileSidebar — the panel the menu button opens.
 *
 * The floating desktop rail leaves this component to compact viewports. It is a
 * narrow wrap of the theme's drawer so the native layout, focus management,
 * scroll lock, close button and menus stay intact. `Navbar` itself is never
 * swizzled: its landmarks and focus order are part of the accessibility
 * contract.
 *
 * One addition: Escape returns focus to the menu toggle. A keyboard user can
 * therefore dismiss the drawer without tabbing through its whole contents.
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

  if (!mobileSidebar.shouldRender) {
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
