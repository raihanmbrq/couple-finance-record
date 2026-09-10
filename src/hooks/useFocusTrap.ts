import { useEffect, type RefObject } from 'react';

/**
 * Stack of currently-mounted focus-trap containers.
 * The last entry (most recently opened overlay) always owns the trap, so nested
 * overlays — e.g. the Date Picker inside the Add Transaction sheet — keep focus
 * to themselves instead of leaking back into their parent.
 */
const trapStack: HTMLElement[] = [];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(el: HTMLElement): boolean {
  return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0 || el === document.activeElement;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;

  const container = trapStack[trapStack.length - 1];
  if (!container) return;

  const focusable = getFocusable(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  // Focus escaped the modal (or is on <body>): pull it back inside.
  if (!active || !container.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  // Wrap around at the edges so Tab never leaves the modal.
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Traps keyboard focus inside the element referenced by `ref` while `active` is true.
 * Safe to nest: only the innermost active trap reacts to Tab.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;

    trapStack.push(container);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      const index = trapStack.lastIndexOf(container);
      if (index !== -1) trapStack.splice(index, 1);
      if (trapStack.length === 0) document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [active, ref]);
}
