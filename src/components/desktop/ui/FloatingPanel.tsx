import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/** Minimum distance kept between the panel and the viewport edges. */
const VIEWPORT_MARGIN = 8;
/** Safety net so the measure → position pass can never loop forever. */
const MAX_MEASURE_PASSES = 4;

interface FloatingPanelProps {
  /** Trigger element the panel is anchored to. */
  anchorRef: RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  /** Horizontal alignment relative to the anchor (default `start`). */
  align?: 'start' | 'end';
  /**
   * Keep the panel at least as wide as its trigger and let it grow for long
   * labels (dropdown lists anchored to full-width fields).
   */
  matchAnchorWidth?: boolean;
  /** Fixed panel width in px (calendar popovers). */
  width?: number;
  /** Maximum visible height before the panel scrolls internally. */
  maxHeight?: number;
  /** Distance between the anchor and the panel. */
  gap?: number;
  /** Stacking order — must sit above the parent modal (`z-50`). */
  zIndex?: number;
  /** Move keyboard focus into the panel while open (calendars only). */
  trapFocus?: boolean;
  testId?: string;
  role?: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Desktop floating popover shell.
 *
 * Renders its children in a `document.body` portal anchored to a trigger, so
 * overlays *never* add height to (or scroll) the dialog they live in — the bug
 * where opening a date picker or a dropdown stretched the Create Goal modal.
 * The panel flips above the anchor when there is no room below, clamps itself
 * to the viewport and re-positions on scroll/resize.
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  anchorRef,
  open,
  onClose,
  align = 'start',
  matchAnchorWidth = false,
  width,
  maxHeight = 320,
  gap = 6,
  zIndex = 60,
  trapFocus = false,
  testId,
  role,
  ariaLabel,
  className = '',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const appliedKeyRef = useRef('');
  const passesRef = useRef(0);

  // The innermost trap owns Tab: while the calendar popover is open it keeps
  // focus to itself, then the surrounding dialog trap resumes on close.
  useFocusTrap(panelRef, open && trapFocus);

  const measure = useCallback((): CSSProperties | null => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return null;

    const rect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = viewportWidth - VIEWPORT_MARGIN * 2;

    const spaceBelow = viewportHeight - rect.bottom - gap - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - gap - VIEWPORT_MARGIN;
    // Prefer opening downwards unless the panel fits clearly better above.
    const opensDown = spaceBelow >= panelRect.height || spaceBelow >= spaceAbove;
    const available = Math.max(120, opensDown ? spaceBelow : spaceAbove);
    const height = Math.min(panelRect.height || available, maxHeight, available);

    const panelWidth = Math.min(width ?? panelRect.width, maxWidth);
    const desiredLeft = align === 'end' ? rect.right - panelWidth : rect.left;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, desiredLeft),
      Math.max(VIEWPORT_MARGIN, viewportWidth - panelWidth - VIEWPORT_MARGIN)
    );
    const top = opensDown ? rect.bottom + gap : Math.max(VIEWPORT_MARGIN, rect.top - gap - height);

    return {
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      width: width ? Math.round(panelWidth) : undefined,
      minWidth: matchAnchorWidth ? Math.min(rect.width, maxWidth) : undefined,
      maxWidth,
      maxHeight: Math.round(available),
      zIndex,
      visibility: 'visible',
    };
  }, [align, anchorRef, gap, matchAnchorWidth, maxHeight, width, zIndex]);

  // Position before paint (no flicker) and re-run once the panel has been
  // measured with its final width; the stable-key guard stops the loop.
  useLayoutEffect(() => {
    if (!open) {
      appliedKeyRef.current = '';
      passesRef.current = 0;
      setStyle(null);
      return;
    }
    if (passesRef.current >= MAX_MEASURE_PASSES) return;

    const next = measure();
    if (!next) return;

    const key = `${next.top}|${next.left}|${next.width}|${next.minWidth}|${next.maxHeight}`;
    if (key === appliedKeyRef.current) return;

    appliedKeyRef.current = key;
    passesRef.current += 1;
    setStyle(next);
  }, [measure, open, style]);

  // Outside click / Escape close. Clicks on the trigger are ignored: the
  // trigger owns its own toggle so the panel does not reopen immediately.
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose, open]);

  // Follow the anchor while the surrounding dialog/page scrolls or resizes.
  // Capture phase catches inner scroll containers (modal body, `main`).
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const next = measure();
        if (!next) return;
        appliedKeyRef.current = `${next.top}|${next.left}|${next.width}|${next.minWidth}|${next.maxHeight}`;
        setStyle(next);
      });
    };

    window.addEventListener('resize', schedule);
    document.addEventListener('scroll', schedule, true);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('scroll', schedule, true);
    };
  }, [measure, open]);

  if (!open) return null;

  const hiddenStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width,
    maxHeight,
    zIndex,
    visibility: 'hidden',
  };

  return createPortal(
    <div
      ref={panelRef}
      data-testid={testId}
      role={role}
      aria-label={ariaLabel}
      style={style ?? hiddenStyle}
      className={`overflow-y-auto rounded-2xl border border-border bg-background shadow-float animate-scale-in ${className}`}
    >
      {children}
    </div>,
    document.body
  );
};
