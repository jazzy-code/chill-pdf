# Progreso

Marca `[x]` al terminar cada fase (build + lint OK + checklist verificado) y agrega notas cortas.

- [x] F0 · Setup
- [x] F1 · Landing y visor
- [x] F2 · Historial, eliminar, reordenar
- [ ] F3 · Fusionar y exportar
- [ ] F4 · Texto
- [ ] F5 · Imágenes
- [ ] F6 · Pulido

## Notas / desviaciones
- **F0**: Next.js 16.4.6 + React 19.3 + Tailwind 4.3. El template trae `cacheComponents` y `partialPrefetching` activos en `next.config.ts` (se dejaron; ojo con `next/dynamic` y `ssr:false` en F1). El template genera `AGENTS.md` ("Next.js con cambios incompatibles: leer `node_modules/next/dist/docs/`"), que se descartó; `next dev` puede volver a crearlo.
- **F0**: shadcn usa el estilo `base-nova` (Base UI, no Radix): las APIs de los componentes pueden diferir de los ejemplos clásicos (p. ej. `render` en vez de `asChild`).
- **F0**: se conservó `@custom-variant dark (&:is(.dark *))` y se quitó el bloque `.dark`, así las clases `dark:` de shadcn no se activan con el modo oscuro del sistema. `<Toaster theme="light">` porque no hay ThemeProvider.
- **F0**: `.claude/launch.json` añadido para el servidor de desarrollo (preview).
- **F1**: pdfjs-dist 6.5: `PDFDocumentProxy.destroy()` ya no existe → se usa `doc.loadingTask.destroy()`; `page.render({ canvas, viewport })`. Añadido `evictPdfDocs(ids)` en `lib/pdfjs.ts` y las cargas fallidas no se cachean.
- **F1**: `PdfCanvas` rellena a su padre (que fija el tamaño = placeholder) y renderiza en un canvas nuevo que sustituye al anterior al terminar (sin parpadeo al hacer zoom). Su IntersectionObserver usa como `root` el contenedor con scroll (si no, `rootMargin` no aplica) y libera el canvas al salir de vista.
- **F1**: página activa = la que ocupa más alto visible (IO con umbrales 0–1), no solo `threshold 0.5`, para que funcione con páginas más altas que el visor. El zoom mantiene anclada la página superior; Ctrl+rueda acumula `deltaY` (suaviza el pinch del trackpad).
- **F1**: el store ya incluye todas las acciones de `00-CONTEXTO.md` (`appendFiles`, `deletePage`, `movePage`, anotaciones) en versión básica; F2/F3 solo tienen que conectarlas a la UI y añadir toasts/undo.
- **Gestor de paquetes: pnpm** (decisión del usuario tras F2). Se borró `package-lock.json`, `package.json` fija `"packageManager": "pnpm@12.6.0"` y los docs usan `pnpm build` / `pnpm lint` / `pnpm dev` / `pnpm add` / `pnpm dlx`. `pnpm-workspace.yaml` excluye `lucide-react@1.77.0` de `minimumReleaseAge` (versión más reciente que el mínimo de días de pnpm).
- **F2**: `undo()`/`redo()` exportados desde `editor-store.ts` (envuelven `temporal` y limpian `selectedId`/`activePageId` huérfanos); úsalos siempre en vez de llamar a `temporal` directamente.
- **F2**: el arrastre se inicia desde la miniatura (`setActivatorNodeRef`); la papelera es hermana, no hija. KeyboardSensor con `start: ['Space']` para que Enter siga navegando. Anuncios de dnd-kit traducidos al español.
- **F2**: se desactivaron `cacheComponents` y `partialPrefetching` en `next.config.ts`: en `next dev` su validación "instant UI" lanzaba un error interno del bundler ("Could not find the module … PlaceValidationBoundaryBelowThisLevel"). No aportan nada a una única página cliente.
- **F1**: `shadcn add` escribió `import { cn } from "cn"` en `components/ui`; se cambió a `@/lib/utils` (que reexporta el paquete `cn` de shadcn 4).
