/**
 * KxAxis Grid System
 * 
 * Deterministic layout with fixed grid coordinates.
 * All nodes snap to grid (col, row) positions.
 * No fractional pixels, no dynamic heights.
 */

export const GRID = {
  COL_WIDTH: 320,    // pixels - fixed column width
  ROW_HEIGHT: 280,   // pixels - fixed row height
  GUTTER_X: 24,      // pixels - horizontal gutter between columns
  GUTTER_Y: 24,      // pixels - vertical gutter between rows
} as const;

/**
 * Convert grid column to pixel X coordinate
 */
export function getGridX(col: number): number {
  return col * (GRID.COL_WIDTH + GRID.GUTTER_X);
}

/**
 * Convert grid row to pixel Y coordinate
 */
export function getGridY(row: number): number {
  return row * (GRID.ROW_HEIGHT + GRID.GUTTER_Y);
}

/**
 * Convert pixel X to grid column (for snapping)
 */
export function snapToGridCol(x: number): number {
  return Math.round(x / (GRID.COL_WIDTH + GRID.GUTTER_X));
}

/**
 * Convert pixel Y to grid row (for snapping)
 */
export function snapToGridRow(y: number): number {
  return Math.round(y / (GRID.ROW_HEIGHT + GRID.GUTTER_Y));
}

/**
 * Get grid bounding box for a node
 */
export function getGridBounds(col: number, row: number, colSpan = 1, rowSpan = 1) {
  return {
    left: getGridX(col),
    top: getGridY(row),
    width: colSpan * GRID.COL_WIDTH + (colSpan - 1) * GRID.GUTTER_X,
    height: rowSpan * GRID.ROW_HEIGHT + (rowSpan - 1) * GRID.GUTTER_Y,
  };
}

