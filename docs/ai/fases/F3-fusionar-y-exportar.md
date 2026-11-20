# F3 · Fusionar PDFs y descargar (prioridad 3 + exportación)

Se hace la exportación aquí (antes de texto/imágenes) para validar temprano borrar/reordenar/fusionar en el PDF final.

## 1. Fusionar
- `appendFiles(files)`: reutiliza `readPdfFile` de `lib/files.ts`; agrega los `SourceDoc` a `sources` y concatena sus páginas al final de `pages` en un solo `set` (una entrada de historial → Ctrl+Z quita todas las páginas añadidas). Toast "Se añadieron N páginas de X".
- Entradas para fusionar:
  - Botón **Añadir PDF** en la toolbar (input file oculto, `multiple`).
  - Soltar archivos PDF sobre la sidebar o el visor: overlay `bg-accent/40 border-dashed` con texto "Suelta para añadir al final". Distinguir de drags internos de dnd-kit comprobando `e.dataTransfer.types.includes('Files')`.
  - Al final de la sidebar: tarjeta "+ Añadir PDF" con el mismo comportamiento que el botón.
- En la landing, múltiples archivos ya se fusionan en orden de selección (F1).

## 2. Exportar (`lib/pdf-export.ts` + `lib/coords.ts` + `lib/fonts.ts`)
- Implementar `exportPdf` según `00-CONTEXTO.md`. En esta fase basta con páginas (copiar en orden); dejar las funciones `drawTextAnnotation` / `drawImageAnnotation` con la firma lista e implementarlas en F4/F5. Crear ya `coords.ts` completo.
- `lib/files.ts` → `downloadBytes(bytes: Uint8Array, name: string)`: `Blob` `application/pdf`, `URL.createObjectURL`, `<a download>`, `revokeObjectURL` tras un `setTimeout`.
- Botón **Descargar**: `isExporting` → spinner y deshabilitado; nombre `${fileName}-editado.pdf`; toast de éxito; errores con toast (PDFs cifrados: mensaje claro).
- Importar `pdf-lib` dinámicamente dentro del handler (`await import('pdf-lib')` vía el módulo de export) para no cargarlo en el bundle inicial.

## Checklist
- [ ] Cargar A (3 pág) + añadir B (2 pág) → 5 miniaturas; Ctrl+Z deja solo las de A.
- [ ] Reordenar mezclando A y B, borrar una, descargar → el PDF abierto en el navegador/Acrobat tiene exactamente ese orden.
- [ ] Soltar un PDF sobre la sidebar lo añade; arrastrar miniaturas NO muestra el overlay de archivos.
- [ ] build + lint OK. Commit "feat: fusionar y descargar".
