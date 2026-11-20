# 00 · Contexto, stack y arquitectura (LEER COMPLETO ANTES DE CUALQUIER FASE)

## Producto
**Chill PDF**: editor de PDF 100 % frontend (sin backend, sin auth, sin base de datos), inspirado en el editor de Small PDF.

Funciones por prioridad:
1. Visualizar el PDF (zoom incluido).
2. Eliminar páginas con historial (Ctrl+Z / Ctrl+Y).
3. Fusionar PDFs.
4. Reordenar páginas con drag & drop desde el panel izquierdo.
5. Agregar texto (fuente, tamaño, negrita, cursiva, subrayado, color, alineación).
6. Agregar imágenes (mover, redimensionar, recortar).
7. Descargar el PDF resultante.

Todo vive en memoria (store de Zustand) mientras la pestaña esté abierta.

## Layout (tipo Small PDF)
```
┌───────────────────────────────────────────────────────────────────────┐
│ Logo │ [Añadir PDF] [Texto] [Imagen] │ ↶ ↷ │ − 100% + [Ajustar] │ [DESCARGAR] │  ← Toolbar (h-16)
├───────────────────────────────────────────────────────────────────────┤
│ (barra contextual de propiedades: aparece solo con texto/imagen seleccionados) │
├──────────┬────────────────────────────────────────────────────────────┤
│ Thumb 1 🗑│                                                            │
│ Thumb 2  │          Visor: páginas apiladas verticalmente,            │
│ Thumb 3  │          centradas, con scroll y zoom                       │
│ (drag)   │                                                            │
│ w-56     │                                                            │
└──────────┴────────────────────────────────────────────────────────────┘
```
- Botón **Eliminar** (icono papelera) arriba a la derecha de cada miniatura, visible solo en hover (`group-hover:opacity-100`).
- Botón **Descargar** grande, color primario, a la derecha de la toolbar.

## Stack (versiones: usar `@latest` al instalar, no fijar a mano)
| Necesidad | Librería | Notas |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind v4 | `src/` dir, alias `@/*` |
| UI | shadcn/ui + lucide-react | componentes en `src/components/ui` |
| Render PDF | `pdfjs-dist` | uso directo (sin react-pdf), solo en cliente |
| Editar/exportar PDF | `pdf-lib` | merge, borrar, reordenar, texto, imágenes |
| Estado | `zustand` | un solo store |
| Undo/Redo | `zundo` | middleware `temporal` sobre el store |
| Drag & drop páginas | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | |
| Mover/redimensionar overlays | `react-rnd` | |
| Recorte de imagen | `react-image-crop` | dentro de un Dialog de shadcn |
| Toasts | `sonner` (vía shadcn) | |
| IDs | `nanoid` | |

**Prohibido** agregar: tests, Jest/Vitest/Playwright, Storybook, Redux, backend/API routes, i18n, analytics. No escribir pruebas unitarias.

## Estructura de carpetas objetivo
```
src/
  app/
    layout.tsx            # fuentes, <Toaster/>, metadata
    page.tsx              # decide: <Landing/> si no hay documento, <Editor/> si hay
    globals.css           # tokens de tema (shadcn) + paleta Chill PDF
  components/
    ui/                   # shadcn (generado)
    landing/Dropzone.tsx
    editor/
      Editor.tsx          # layout general (client)
      Toolbar.tsx
      PropertiesBar.tsx   # barra contextual texto/imagen
      PagesSidebar.tsx    # lista sortable de miniaturas
      PageThumbnail.tsx
      Viewer.tsx          # scroll + zoom
      PageView.tsx        # canvas de una página + capa de anotaciones
      PdfCanvas.tsx       # render pdfjs a <canvas> (reutilizado por thumb y visor)
      TextAnnotation.tsx
      ImageAnnotation.tsx
      CropDialog.tsx
  lib/
    pdfjs.ts              # carga perezosa de pdfjs + caché de documentos
    pdf-export.ts         # exportación con pdf-lib
    coords.ts             # conversión coordenadas vista → PDF
    files.ts              # lectura de archivos, normalización de imágenes, descarga
    fonts.ts              # mapeo fuente UI ↔ StandardFonts
  store/
    editor-store.ts       # zustand + zundo
  hooks/
    useKeyboardShortcuts.ts
  types/
    editor.ts
```

## Modelo de datos (`src/types/editor.ts`) — usar EXACTAMENTE esto
```ts
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
```

**Regla de oro de coordenadas:** todas las anotaciones se guardan en *puntos PDF* (escala 1), origen arriba-izquierda de la página visible. En pantalla se multiplica por `zoom`. Al arrastrar/redimensionar se divide entre `zoom` antes de guardar. La conversión a coordenadas reales de PDF (origen abajo-izquierda, rotación, mediaBox) se hace SOLO en `lib/coords.ts` durante la exportación.

## Store (`src/store/editor-store.ts`)
Estado:
```ts
interface EditorState {
  // --- con historial (zundo) ---
  pages: PageItem[];                 // el ORDEN del array es el orden del PDF final
  annotations: Annotation[];
  // --- sin historial ---
  sources: Record<string, SourceDoc>; // solo se agrega, nunca se borra (el undo puede volver a necesitarlo)
  fileName: string;                  // nombre base para la descarga
  zoom: number;                      // 0.25 – 3, default 1
  selectedId: string | null;         // anotación seleccionada
  tool: 'select' | 'text';           // 'text' = el próximo click en una página crea un texto
  activePageId: string | null;       // página visible/activa (para insertar imágenes)
  isExporting: boolean;
}
```
Acciones mínimas: `loadFiles(files: File[])` (reemplaza todo, limpia historial), `appendFiles(files: File[])` (merge), `deletePage(id)` (borra también sus anotaciones; no permitir borrar la última página → toast), `movePage(activeId, overId)` (usar `arrayMove`), `addAnnotation(a)`, `updateAnnotation(id, patch)`, `removeAnnotation(id)`, `setZoom`, `setTool`, `select`, `setActivePage`, `reset()`.

Historial con zundo:
```ts
create<EditorState>()(
  temporal(
    (set, get) => ({ ... }),
    {
      partialize: (s) => ({ pages: s.pages, annotations: s.annotations }),
      limit: 100,
      equality: (a, b) => a.pages === b.pages && a.annotations === b.annotations,
    }
  )
)
```
- Acceso: `useEditorStore.temporal.getState().undo()` / `.redo()` / `.clear()`. Para habilitar/deshabilitar botones: `useStore(useEditorStore.temporal, s => s.pastStates.length)`.
- **Siempre actualizar inmutablemente** (nuevos arrays/objetos) para que `equality` funcione.
- Para no llenar el historial: arrastre/resize se guardan solo en `onDragStop`/`onResizeStop`; el texto se edita en estado local y se guarda en `onBlur`. Cambios de estilo (negrita, color…) sí generan una entrada cada uno.
- Tras `undo/redo`, si `selectedId` ya no existe en `annotations`, ponerlo en `null`.

## pdfjs en Next.js (`src/lib/pdfjs.ts`) — patrón obligatorio
```ts
'use client';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
export function getPdfDoc(source: { id: string; bytes: Uint8Array }) {
  let p = docCache.get(source.id);
  if (!p) {
    // pdfjs TRANSFIERE (detacha) el buffer → pasar SIEMPRE una copia
    p = getPdfjs().then((pdfjs) => pdfjs.getDocument({ data: source.bytes.slice() }).promise);
    docCache.set(source.id, p);
  }
  return p;
}
export function clearPdfCache() { docCache.forEach(p => p.then(d => d.destroy())); docCache.clear(); }
```
- Si el build falla con `Can't resolve 'canvas'`: en `next.config.ts` añadir `turbopack: { resolveAlias: { canvas: './src/lib/empty.ts' } }` y `webpack: (c) => { c.resolve.alias.canvas = false; return c; }` (crear `empty.ts` con `export {}`).
- Si el worker no carga con `new URL(...)`, copiar `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` a `public/` con un script `postinstall` y usar `'/pdf.worker.min.mjs'`.
- Todo componente que use pdfjs es `'use client'`. `Editor` se importa en `page.tsx` con `next/dynamic(..., { ssr: false })`.

## Render de página (`PdfCanvas.tsx`)
Props: `{ source: SourceDoc; pageIndex: number; scale: number; className? }`.
- Obtener `page = await doc.getPage(pageIndex + 1)`, `viewport = page.getViewport({ scale: scale * dpr })` con `dpr = Math.min(window.devicePixelRatio || 1, 2)`.
- Canvas: `width/height` = viewport; estilo CSS = viewport / dpr.
- Guardar el `renderTask` y llamar `renderTask.cancel()` en el cleanup del effect (ignorar el error `RenderingCancelledException`).
- Render perezoso: solo renderizar cuando el contenedor entra en viewport (IntersectionObserver con `rootMargin: '600px'`); antes mostrar un placeholder blanco del tamaño correcto (`width*scale × height*scale`) para no saltar el layout.
- Con zoom, debounce de 150 ms antes de re-renderizar; mientras tanto escalar con CSS.

## Exportación (`src/lib/pdf-export.ts`)
```
exportPdf(pages, annotations, sources): Promise<Uint8Array>
```
1. `out = await PDFDocument.create()`.
2. Por cada `sourceId` usado: `PDFDocument.load(bytes, { ignoreEncryption: true })` una sola vez (caché local).
3. Copiar páginas en el orden de `pages` con `out.copyPages(srcDoc, [indices])` (agrupar por source para eficiencia pero respetar el orden final al hacer `out.addPage`).
4. Por cada anotación de esa página, dibujar con `coords.ts`:
   - Texto: `fonts.ts` mapea `(family, bold, italic)` → `StandardFonts` (Helvetica / HelveticaBold / HelveticaOblique / HelveticaBoldOblique, TimesRoman / TimesRomanBold / TimesRomanItalic / TimesRomanBoldItalic, Courier / CourierBold / CourierOblique / CourierBoldOblique). Embebe cada fuente una sola vez (caché).
   - Envolver líneas igual que en pantalla: dividir por `\n`, luego word-wrap con `font.widthOfTextAtSize` contra `width`. `lineHeight = fontSize * 1.2`. Offset X por alineación. Baseline de la línea i: `y + i*lineHeight + (lineHeight - fontSize)/2 + fontSize*0.8` (ajustar visualmente si hace falta).
   - Subrayado: `page.drawLine` bajo cada línea (grosor `fontSize/15`).
   - Las StandardFonts solo soportan WinAnsi (acentos y ñ sí; emojis no): reemplazar caracteres no codificables por `?` con un try/catch por carácter (`font.encodeText`).
   - Imagen: `embedPng`/`embedJpg` del dataURL (caché por src), `drawImage`.
   - Color: hex → `rgb(r/255, g/255, b/255)`.
5. `return out.save()`.

## Coordenadas (`src/lib/coords.ts`) — implementar tal cual
```ts
import type { PDFPage } from 'pdf-lib';
// Convierte un punto de la vista (origen arriba-izquierda, puntos PDF, página ya rotada) a espacio PDF.
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
```
- Texto: punto ancla = inicio de baseline en vista `(x + offsetX, baselineY)` → `toPdfPoint`, y `drawText(line, { x, y, size, font, color, rotate: degrees(pageRotation(page)) })`.
- Imagen: ancla = esquina inferior-izquierda en vista `(x, y + height)` → `toPdfPoint`, `drawImage(img, { x, y, width, height, rotate: degrees(rot) })`.

## Convenciones
- Idioma de la UI: **español**. Código, nombres y comentarios: inglés, comentarios mínimos.
- Componentes funcionales, `'use client'` donde haya estado/efectos.
- Nada de `any` salvo donde las libs lo obliguen.
- No crear archivos fuera de la estructura sin necesidad. No crear README extra ni documentación.
- Al terminar cada fase: `pnpm build` y `pnpm lint` deben pasar sin errores. Verificación manual con `pnpm dev` según el checklist de la fase. Esa es toda la "prueba" requerida.
