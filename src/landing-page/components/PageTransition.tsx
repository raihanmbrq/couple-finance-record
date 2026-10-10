import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  /** Extra classes merged onto the animated wrapper (which renders a <main> element). */
  className?: string;
}

/**
 * Wraps page content in a <main> element that replays a subtle fade + rise
 * animation every time the route (pathname) changes.
 *
 * Uses `key={pathname}` so navigating between routes that reuse the same
 * component instance (e.g. /produk/a -> /produk/b) still re-triggers the effect.
 *
 * Note: the animation must not wrap `position: fixed` chrome (like the landing
 * Navbar), because a transformed ancestor becomes the containing block for it.
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
  const { pathname } = useLocation();

  return (
    <main
      key={pathname}
      className={className ? `animate-page-enter ${className}` : 'animate-page-enter'}
    >
      {children}
    </main>
  );
}
