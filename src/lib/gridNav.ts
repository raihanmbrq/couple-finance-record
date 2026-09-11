// Shared 2D grid navigation math for desktop workspaces.
// Used by the Add Transaction modal and the Desktop Wallet Management workspace
// so the CSS `grid-cols-*` geometry and the arrow-key math never drift apart.

export type GridDirection = 'up' | 'down' | 'left' | 'right';

export const ARROW_DIRECTIONS: Record<string, GridDirection | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * 2D matrix navigation for a (possibly partial) grid.
 *
 * - Left/Right move through the current row and wrap at the row edges.
 * - Up/Down hop exactly one row (`index ± columns`). At the first/last row the
 *   index is clamped, and a short final row is resolved so focus never lands on
 *   a non-existent cell (no out-of-bounds, no thrown errors).
 */
export function getNextGridIndex(
  currentIndex: number,
  total: number,
  columns: number,
  direction: GridDirection
): number {
  if (total <= 0) return 0;

  const index = Math.max(0, Math.min(currentIndex, total - 1));
  const columnsSafe = Math.max(1, columns);
  const row = Math.floor(index / columnsSafe);
  const col = index % columnsSafe;
  const rowStart = row * columnsSafe;
  const rowEnd = Math.min(rowStart + columnsSafe - 1, total - 1);

  switch (direction) {
    case 'left':
      return col > 0 ? index - 1 : rowEnd;
    case 'right':
      return index < rowEnd ? index + 1 : rowStart;
    case 'up':
      return index - columnsSafe >= 0 ? index - columnsSafe : index;
    case 'down': {
      const target = index + columnsSafe;
      if (target < total) return target;
      const lastIndex = total - 1;
      const lastRow = Math.floor(lastIndex / columnsSafe);
      if (row < lastRow) {
        const candidate = lastRow * columnsSafe + col;
        return candidate <= lastIndex ? candidate : lastIndex;
      }
      return index;
    }
    default:
      return index;
  }
}
