# F5 · Agregar imágenes (prioridad 6)

## 1. Insertar
- Botón **Imagen** (icono `ImagePlus`) abre `<input type="file" accept="image/png,image/jpeg,image/webp,image/gif">`.
- También: soltar una imagen sobre una página (en `PageView`, si `dataTransfer` trae un archivo `image/*`) → insertar en el punto donde se soltó.
- `lib/files.ts` → `normalizeImage(file): Promise<{ src, mime, naturalWidth, naturalHeight }>`:
  - Cargar en `HTMLImageElement`; si el lado mayor > 2000px, reescalar con canvas.
  - JPEG se queda JPEG (`toDataURL('image/jpeg', 0.92)`); todo lo demás → PNG (pdf-lib solo soporta PNG/JPEG).
- Tamaño inicial: que quepa en 50 % del ancho de la página activa conservando proporción; posición centrada en la página activa (`activePageId`) o en el punto de drop.
- `addAnnotation({ type:'image', src, originalSrc: src, mime, ... })` + `select(id)`.

## 2. `ImageAnnotation.tsx`
- `react-rnd` como el texto (posición/tamaño × zoom, commit ÷ zoom en `onDragStop`/`onResizeStop`, `bounds="parent"`).
- `lockAspectRatio` por defecto; con Shift presionado al redimensionar se libera (leer `e.shiftKey` en `onResizeStart` y guardarlo en estado local).
- Handles en las 4 esquinas y 4 lados, estilizados según `01-DISENO.md` (`resizeHandleClasses` / `resizeHandleStyles`).
- `<img draggable={false} className="w-full h-full select-none pointer-events-none" />` (el `object-fill` respeta el tamaño exacto, igual que en la exportación).
- Doble click → abre recorte.

## 3. Recortar (`CropDialog.tsx`)
- Dialog de shadcn con `react-image-crop` (`import 'react-image-crop/dist/ReactCrop.css'`) sobre `originalSrc`.
- Opciones de proporción: Libre, 1:1, 4:3, 16:9 (ToggleGroup).
- Botón "Aplicar": recortar con canvas usando las coordenadas en píxeles naturales (`crop` en % → convertir con `naturalWidth/Height`), generar nuevo dataURL (mismo mime) y `updateAnnotation({ src: nuevo, width: anchoActual, height: anchoActual * (cropH/cropW) })` en un solo update. "Restablecer" vuelve a `originalSrc`.
- Guardar en el store el último crop (`crop?: { x, y, width, height }` en % — añadirlo como campo opcional a `ImageAnnotation` en `types/editor.ts`) para precargarlo al reabrir.

## 4. `PropertiesBar` (imagen seleccionada)
Botones: **Recortar** (`Crop`), **Reemplazar** (input file, conserva posición y ancho), **Traer al frente / Enviar atrás** (reordenar dentro de `annotations`; el orden del array = z-index y orden de dibujo en la exportación), **Eliminar**.

## 5. Exportación
Implementar `drawImageAnnotation` (embed con caché por `src`, ancla inferior-izquierda vía `toPdfPoint`, `rotate` según rotación de página). Respetar el orden de `annotations` al dibujar (imágenes y textos intercalados).

## Checklist
- [ ] Insertar PNG, JPEG, WEBP; mover, redimensionar con y sin Shift; recortar y restablecer.
- [ ] Ctrl+Z deshace cada mover/redimensionar/recorte por separado.
- [ ] Soltar imagen sobre una página la coloca donde se soltó.
- [ ] Descargar: imágenes en posición, tamaño y recorte correctos; texto encima/debajo según el orden.
- [ ] build + lint OK. Commit "feat: imágenes".
