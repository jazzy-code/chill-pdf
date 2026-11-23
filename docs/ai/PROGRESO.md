# Progreso

Marca `[x]` al terminar cada fase (build + lint OK + checklist verificado) y agrega notas cortas.

- [x] F0 · Setup
- [x] F1 · Landing y visor
- [x] F2 · Historial, eliminar, reordenar
- [x] F3 · Fusionar y exportar
- [x] F4 · Texto
- [x] F5 · Imágenes
- [x] F6 · Pulido

## Notas / desviaciones
- **F0**: Next.js 16.4.6 + React 19.3 + Tailwind 4.3. El template trae `cacheComponents` y `partialPrefetching` activos en `next.config.ts` (se dejaron; ojo con `next/dynamic` y `ssr:false` en F1). El template genera `AGENTS.md` ("Next.js con cambios incompatibles: leer `node_modules/next/dist/docs/`"), que se descartó; `next dev` puede volver a crearlo.
- **F0**: shadcn usa el estilo `base-nova` (Base UI, no Radix): las APIs de los componentes pueden diferir de los ejemplos clásicos (p. ej. `render` en vez de `asChild`).
- **F0**: se conservó `@custom-variant dark (&:is(.dark *))` y se quitó el bloque `.dark`, así las clases `dark:` de shadcn no se activan con el modo oscuro del sistema. `<Toaster theme="light">` porque no hay ThemeProvider.
- **F0**: `.claude/launch.json` añadido para el servidor de desarrollo (preview).
- **F1**: pdfjs-dist 6.5: `PDFDocumentProxy.destroy()` ya no existe → se usa `doc.loadingTask.destroy()`; `page.render({ canvas, viewport })`. Añadido `evictPdfDocs(ids)` en `lib/pdfjs.ts` y las cargas fallidas no se cachean.
- **F1**: `PdfCanvas` rellena a su padre (que fija el tamaño = placeholder) y renderiza en un canvas nuevo que sustituye al anterior al terminar (sin parpadeo al hacer zoom). Su IntersectionObserver usa como `root` el contenedor con scroll (si no, `rootMargin` no aplica) y libera el canvas al salir de vista.
- **F1**: página activa = la que ocupa más alto visible (IO con umbrales 0–1), no solo `threshold 0.5`, para que funcione con páginas más altas que el visor. El zoom mantiene anclada la página superior; Ctrl+rueda acumula `deltaY` (suaviza el pinch del trackpad).
- **F1**: el store ya incluye todas las acciones de `00-CONTEXTO.md` (`appendFiles`, `deletePage`, `movePage`, anotaciones) en versión básica; F2/F3 solo tienen que conectarlas a la UI y añadir toasts/undo.
- **F6 (petición del usuario)**: botón **Nuevo** junto a Descargar (y el logo) → `NewDocumentDialog` (confirmación siempre: una sesión restaurada tiene cambios aunque el historial esté vacío) → `reset()`, que también borra la sesión guardada. Sustituye al `window.confirm` del logo.
- **F6**: sesión en IndexedDB (`lib/session.ts` + `hooks/useSessionPersistence.ts`, `idb-keyval`): guarda 1 s después de cada cambio, solo los `sources` que siguen en uso, e intenta guardar también al cerrar la pestaña. `ResumeCard` en la portada → `restoreSession()`. Si IndexedDB falla (modo privado, sin espacio) la app sigue funcionando; solo se pierde poder reanudar.
- **F6**: `Ctrl+S` funciona también escribiendo un texto (lo confirma antes de descargar). Indicador de carga en miniaturas y páginas solo con CSS: queda debajo del canvas y este lo tapa al dibujarse.
- **F6**: responsive: < 768 px barra lateral `w-28` y miniaturas de 80 px (`useMediaQuery`); en móvil el logo se oculta (Nuevo hace lo mismo), la barra central usa `justify-center-safe` y se desliza; papelera siempre visible en pantallas táctiles. La etiqueta «Nuevo» aparece desde `xl` para no desbordar a 1024 px.
- **F6**: `cursor: pointer` global para botones movido dentro de `@layer base` (fuera de capa pisaba `cursor-grab` de las miniaturas). Favicon `src/app/icon.svg` y `themeColor` con colores fijos (los SVG y metadatos no leen variables CSS); se borró `favicon.ico`.
- **Aviso dev**: instalar dependencias con `pnpm dev` encendido puede dejar a Turbopack sin vigilar `globals.css` (sirve CSS viejo). Solución: reiniciar `pnpm dev`.
- **F5**: soltar imágenes lo gestiona `FileDropZone` (no `PageView`): la imagen va a la página y al punto bajo el cursor; los PDF se siguen añadiendo al final. Durante el arrastre solo se leen los tipos MIME, así que el aviso cambia a «Suelta la imagen sobre una página» y no tapa las páginas.
- **F5**: `normalizeImage` pasa SIEMPRE por canvas (también los JPEG) para fijar la orientación EXIF en los píxeles; pdf-lib ignora EXIF y la foto saldría girada.
- **F5**: el orden del array `annotations` es el apilado en pantalla y en la exportación. El texto ya no sube de z-index al seleccionarlo, solo mientras se edita. `reorderAnnotation(id, 'front' | 'back')` no crea entrada de historial si no cambia nada.
- **F5**: con la proporción bloqueada, react-rnd (re-resizable) hace que las esquinas sigan el movimiento vertical y los laterales el horizontal. Es comportamiento de la librería; con Shift la proporción queda libre.
- **F5**: `croppingId` en el store (sin historial) abre `CropDialog`; mientras está abierto, los atajos globales (Ctrl+Z, Supr) no actúan.
- **F5 (sin probar)**: «Reemplazar» y el botón **Imagen** usan el selector de archivos nativo, que no se puede automatizar; la lógica compartida (`normalizeImage`, `insertImage`) sí se probó soltando archivos.
- **F4**: el ajuste de línea NO lo hace el navegador: `lib/text-layout.ts` (`wrapText`) es un único algoritmo que usan la pantalla (medida con canvas `measureText`) y la exportación (`font.widthOfTextAtSize`). El modo vista pinta una `div` por línea calculada. Así pantalla y PDF parten igual y la altura se calcula sin medir el DOM (`layoutText`), por lo que cada cambio de estilo es **una** entrada de historial con la altura ya recalculada. Las fuentes de pantalla (Arial, Times New Roman, Courier New) tienen las mismas métricas que las StandardFonts.
- **F4**: baseline en la exportación = `y + i·lineHeight + fontSize·BASELINE_EM[fuente]` (`fonts.ts`), calculado con ascent/descent de las fuentes de Windows en vez del `0.8` genérico; subrayado a `0.12em` bajo la baseline. Medido: PDF vs editor ≤ 1,5 pt de diferencia (páginas vertical, horizontal y rotada 90°). En macOS (Helvetica real) puede variar ~1 px.
- **F4**: la caja de texto no lleva los `+4` de relleno: altura = líneas × fontSize × 1,2, así `y` es exactamente el borde superior de la primera línea.
- **F4**: estado sin historial en el store: `editingId` (texto en edición) y `lastTextStyle`. El color personalizado (`<input type="color">`) solo guarda en el evento nativo `change` para no llenar el historial mientras se arrastra el selector.
- **F4**: los controles con menú propio (Select de fuente/tamaño, Popover de color) cierran la edición al abrirse (el texto se guarda en el blur); los botones (B/I/U, alineación, −/+) mantienen el foco con `onMouseDown preventDefault`.
- **F3**: `pickAndAppendPdfs()` y `downloadDocument()` viven en `editor-store.ts` (los usan toolbar y sidebar). `pickFiles(accept, multiple)` en `lib/files.ts` sirve también para imágenes en F5. `fonts.ts` ya tiene `FONT_OPTIONS`, `cssFontFamily()` y `standardFontFor()` (devuelve el nombre de StandardFonts como string para no cargar pdf-lib en el bundle inicial).
- **F3**: `exportPdf` lanza `EncryptedSourceError` si un origen está cifrado (con `ignoreEncryption` pdf-lib copiaría páginas ilegibles) → toast claro. Si la misma página de origen aparece dos veces, se copia de nuevo.
- **F3**: `drawTextAnnotation` / `drawImageAnnotation` existen con firma `(ctx: DrawContext, a)`; `ctx` trae `lib`, `doc`, `page` y cachés de fuentes e imágenes. Se implementan en F4/F5.
- **F3 (corrige F2)**: el `KeyboardSensor` de dnd-kit fallaba con la barra lateral desplazada (no movía nada o movía otra página). Se quitó: el teclado reordena con **Alt+↑/↓** sobre la miniatura (foco y anuncio `aria-live` incluidos). El arrastre con ratón/táctil sigue con dnd-kit.
- **Gestor de paquetes: pnpm** (decisión del usuario tras F2). Se borró `package-lock.json`, `package.json` fija `"packageManager": "pnpm@12.6.0"` y los docs usan `pnpm build` / `pnpm lint` / `pnpm dev` / `pnpm add` / `pnpm dlx`. `pnpm-workspace.yaml` excluye `lucide-react@1.77.0` de `minimumReleaseAge` (versión más reciente que el mínimo de días de pnpm).
- **F2**: `undo()`/`redo()` exportados desde `editor-store.ts` (envuelven `temporal` y limpian `selectedId`/`activePageId` huérfanos); úsalos siempre en vez de llamar a `temporal` directamente.
- **F2**: el arrastre se inicia desde la miniatura (`setActivatorNodeRef`); la papelera es hermana, no hija. KeyboardSensor con `start: ['Space']` para que Enter siga navegando. Anuncios de dnd-kit traducidos al español.
- **F2**: se desactivaron `cacheComponents` y `partialPrefetching` en `next.config.ts`: en `next dev` su validación "instant UI" lanzaba un error interno del bundler ("Could not find the module … PlaceValidationBoundaryBelowThisLevel"). No aportan nada a una única página cliente.
- **F1**: `shadcn add` escribió `import { cn } from "cn"` en `components/ui`; se cambió a `@/lib/utils` (que reexporta el paquete `cn` de shadcn 4).
