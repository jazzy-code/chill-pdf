export type FontFamily = 'helvetica' | 'times' | 'courier';
export type TextAlign = 'left' | 'center' | 'right';

export interface SourceDoc {
  id: string;          // nanoid
  name: string;        // nombre del archivo
  bytes: Uint8Array;   // bytes originales — NUNCA mutar ni pasar directo a pdfjs (ver lib/pdfjs.ts)
  pageCount: number;
}

export interface PageItem {
  id: string;              // nanoid, estable (key de React y de dnd-kit)
  sourceId: string;        // SourceDoc.id
  sourceIndex: number;     // índice 0-based de la página en el doc original
  width: number;           // ancho en puntos PDF tal como se VE (ya aplicada la rotación propia del PDF)
  height: number;          // alto en puntos PDF tal como se ve
  rotation: 0 | 90 | 180 | 270; // rotación intrínseca del PDF original (page.rotate de pdfjs)
}

interface BaseAnnotation {
  id: string;
  pageId: string;   // PageItem.id
  x: number;        // en puntos PDF, origen ARRIBA-IZQUIERDA de la página tal como se ve
  y: number;
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontFamily: FontFamily;
  fontSize: number;      // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;         // '#rrggbb'
  align: TextAlign;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  src: string;           // dataURL actual (ya recortada si aplica). Solo PNG o JPEG.
  originalSrc: string;   // dataURL original sin recortar (para volver a recortar)
  mime: 'image/png' | 'image/jpeg';
}

export type Annotation = TextAnnotation | ImageAnnotation;
