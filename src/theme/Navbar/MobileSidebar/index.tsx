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
 * narrow wrap of the theme's drawer so the native layout, scroll lock, close
 * button and contextual menus stay intact. `Navbar` itself is never
 * swizzled: its landmarks and focus order are part of the accessibility
 * contract.
 *
 * Adds modal semantics, focus entry/containment and restoration to the actual
 * opener, including the guide's Secciones button. Escape closes the drawer.
 */
export default function NavbarMobileSidebar(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  useLockBodyScroll(mobileSidebar.shown);

  useEffect(() => {
    if (!mobileSidebar.shown) return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = document.querySelector<HTMLElement>('.navbar-sidebar');
    if (!panel) return undefined;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
      .filter(element => !element.closest('[inert]') && element.getClientRects().length > 0);
    // Infima animates visibility as well as position. The first animation frame
    // can still be hidden, in which case focus() is ignored by the browser.
    // Retry on the next paint and on transition completion, without stealing
    // focus once the user has already entered the native panel.
    let frame = 0;
    const focusPanel = () => {
      if (!panel.contains(document.activeElement)) {
        panel.querySelector<HTMLElement>('.navbar-sidebar__close')?.focus({preventScroll: true});
      }
    };
    frame = requestAnimationFrame(() => {
      focusPanel();
      frame = requestAnimationFrame(focusPanel);
    });
    panel.addEventListener('transitionend', focusPanel);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        mobileSidebar.toggle();
      } else if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener('transitionend', focusPanel);
      document.removeEventListener('keydown', onKey);
      (opener?.isConnected ? opener : document.querySelector<HTMLElement>('.navbar__toggle'))?.focus();
    };
  }, [mobileSidebar.shown, mobileSidebar.toggle]);

  if (mobileSidebar.disabled) {
    return null;
  }
  return (
    <div className="navbar-dialog" role={mobileSidebar.shown ? 'dialog' : undefined} aria-modal={mobileSidebar.shown || undefined} aria-label="Navegación" inert={!mobileSidebar.shown}>
      <NavbarMobileSidebarLayout
      header={<NavbarMobileSidebarHeader />}
      primaryMenu={<NavbarMobileSidebarPrimaryMenu />}
      secondaryMenu={<NavbarMobileSidebarSecondaryMenu />}
      />
    </div>
  );
}
