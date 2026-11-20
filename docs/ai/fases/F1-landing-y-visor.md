# F1 · Landing, carga y visor (prioridad 1)

Objetivo: soltar/seleccionar PDF(s) → abrir el editor con miniaturas a la izquierda, páginas a la derecha y zoom.

## 1. Store base (`src/store/editor-store.ts`)
Crear el store completo de `00-CONTEXTO.md` (con `temporal` de zundo ya configurado aunque el undo se conecte en F2).
- `loadFiles(files)`:
  1. Filtrar `application/pdf` (o extensión `.pdf`); si ninguno → toast de error.
  2. Por archivo: `bytes = new Uint8Array(await file.arrayBuffer())`, `doc = await getPdfDoc({id, bytes})`.
  3. Por cada página: `p = await doc.getPage(i+1)`, `vp = p.getViewport({ scale: 1 })` → `PageItem { width: vp.width, height: vp.height, rotation: p.rotate }`.
  4. Si un archivo falla (PDF corrupto o con contraseña) → toast "No pudimos abrir X" y continuar con los demás.
  5. `set({ sources, pages, annotations: [], fileName: <nombre del primero sin .pdf>, selectedId: null, activePageId: pages[0].id })` y luego `useEditorStore.temporal.getState().clear()`.
- Poner la lógica de lectura de archivos en `src/lib/files.ts` (`readPdfFile(file) → { source, pages }`) para reutilizarla en `appendFiles` (F3).
- `reset()`: limpia todo, `clearPdfCache()`, `temporal.clear()`.

## 2. Landing (`components/landing/Dropzone.tsx`)
- Según `01-DISENO.md`. Drag & drop nativo (onDragOver/onDrop) + `<input type="file" accept="application/pdf" multiple hidden>`.
- Estado "cargando" con spinner (`Loader2 animate-spin`) mientras `loadFiles` corre.

## 3. `page.tsx`
```tsx
'use client';
const Editor = dynamic(() => import('@/components/editor/Editor'), { ssr: false });
// si pages.length === 0 → <Dropzone/>, si no → <Editor/>
```

## 4. Editor layout (`Editor.tsx`)
`h-dvh flex flex-col` → `<Toolbar/>`, `<PropertiesBar/>` (vacío por ahora), y `flex flex-1 min-h-0` con `<PagesSidebar/>` (w-56, scroll propio, `border-r bg-card`) y `<Viewer/>` (flex-1, scroll propio, `bg-muted`).

## 5. `PdfCanvas.tsx`
Según la sección "Render de página" de `00-CONTEXTO.md` (lazy, cancelación, dpr, debounce).

## 6. `Viewer.tsx` + `PageView.tsx`
- Lista vertical centrada de `PageView` (`flex flex-col items-center gap-6 py-8`). Cada `PageView` tiene `id={'page-' + page.id}`, `position: relative`, tamaño `page.width*zoom × page.height*zoom`, `PdfCanvas` de fondo y un `div absolute inset-0` vacío para anotaciones (se usa en F4/F5).
- Página activa: IntersectionObserver sobre los `PageView` (threshold 0.5) → `setActivePage`.
- Zoom: `Ctrl + rueda` dentro del visor (preventDefault, listener con `{ passive: false }`), pasos de ±10 %, límites 25 %–300 %.

## 7. `PagesSidebar.tsx` + `PageThumbnail.tsx` (sin drag todavía)
- Miniatura: `PdfCanvas` con `scale = 160 / page.width` (ancho fijo ~160px), número de página debajo.
- Click → `document.getElementById('page-'+id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })` y `setActivePage`.
- La activa con `ring-2 ring-primary`; la sidebar hace scroll a la miniatura activa si queda fuera de vista.

## 8. `Toolbar.tsx` (estructura completa, acciones conectadas progresivamente)
Izquierda: logo "Chill PDF" (click → confirm "¿Cerrar este documento? Perderás los cambios" → `reset()`).
Centro: botones **Añadir PDF**, **Texto**, **Imagen** (deshabilitados hasta F3/F4/F5), separador, **Deshacer/Rehacer** (deshabilitados hasta F2), separador, zoom: `−`, porcentaje (dropdown con 50/75/100/125/150/200 % y "Ajustar al ancho"), `+`.
Derecha: botón grande **Descargar** (deshabilitado hasta F3).
- "Ajustar al ancho": `zoom = (anchoVisor - 64) / maxPageWidth`.

## Checklist
- [ ] Soltar un PDF de 30+ páginas abre el editor rápido; las páginas se renderizan al hacer scroll (lazy).
- [ ] Zoom con botones, dropdown y Ctrl+rueda; el texto se ve nítido tras el debounce.
- [ ] Click en miniatura navega; la miniatura activa se actualiza al hacer scroll.
- [ ] Un PDF con páginas horizontales/rotadas se ve correcto.
- [ ] Archivo no-PDF o corrupto → toast, sin crash.
- [ ] build + lint OK. Commit "feat: landing y visor".
