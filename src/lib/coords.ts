import type { PDFPage } from 'pdf-lib';

// Converts a view point (top-left origin, PDF points, page as displayed/rotated) to PDF space.
export function toPdfPoint(page: PDFPage, vx: number, vy: number) {
  const { x: ox, y: oy, width: W, height: H } = page.getMediaBox();
  const rot = ((page.getRotation().angle % 360) + 360) % 360;
  switch (rot) {
    case 90:  return { x: ox + vy,     y: oy + vx };
    case 180: return { x: ox + W - vx, y: oy + vy };
    case 270: return { x: ox + W - vy, y: oy + H - vx };
    default:  return { x: ox + vx,     y: oy + H - vy };
  }
}

export const pageRotation = (page: PDFPage) => ((page.getRotation().angle % 360) + 360) % 360;
