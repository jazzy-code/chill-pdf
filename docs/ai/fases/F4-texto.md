# F4 · Agregar texto (prioridad 5)

## 1. Crear
- Botón **Texto** (icono `Type`) activa `tool: 'text'` (botón con estado activo). Cursor `crosshair` sobre las páginas.
- Click en la capa de anotaciones de un `PageView` con `tool === 'text'`:
  `x = offsetX / zoom`, `y = offsetY / zoom` → `addAnnotation({ type:'text', text:'', width: 200, height: fontSize*1.2+4, fontFamily:'helvetica', fontSize:16, bold:false, italic:false, underline:false, color:'#1f2937', align:'left', ... })`, `select(id)`, volver a `tool: 'select'` y entrar directo en modo edición (autofocus).
- Últimos estilos usados se recuerdan (variable en el store sin historial, `lastTextStyle`) para el siguiente texto.
- Si al salir de edición el texto queda vacío → `removeAnnotation` (sin dejar basura en el historial: si se creó y se borró vacío, está bien que queden 2 entradas; no complicarlo).

## 2. `TextAnnotation.tsx`
- Envuelto en `react-rnd`:
  - `position={{ x: a.x*zoom, y: a.y*zoom }}`, `size={{ width: a.width*zoom, height: a.height*zoom }}`, `bounds="parent"`.
  - `onDragStop` / `onResizeStop` → `updateAnnotation` con valores ÷ zoom (un solo update por gesto).
  - `enableResizing` solo horizontal (`left`, `right`) — la altura se calcula sola.
  - `disableDragging` mientras se edita; `cancel=".no-drag"` para la textarea.
- Modo vista: `div` con `whitespace-pre-wrap break-words` y los estilos. Doble click → modo edición.
- Modo edición: `<textarea className="no-drag">` transparente, sin padding ni borde, `resize-none overflow-hidden`, MISMOS estilos que el modo vista. Estado local del texto; `onBlur` → `updateAnnotation({ text, height })`.
- Altura automática: tras cada cambio medir `scrollHeight / zoom` y guardarla en el commit.
- Estilos CSS (deben coincidir con la exportación):
  - `fontFamily`: helvetica → `Helvetica, Arial, sans-serif`; times → `"Times New Roman", Times, serif`; courier → `"Courier New", Courier, monospace` (mapa en `lib/fonts.ts`).
  - `fontSize: a.fontSize * zoom px`, `lineHeight: 1.2`, `fontWeight`, `fontStyle`, `textDecoration`, `color`, `textAlign`.
- Seleccionado: outline punteado primario. Click fuera (en la página vacía o el visor) → `select(null)`.
- Click en una anotación → `select(id)` con `stopPropagation`.

## 3. `PropertiesBar.tsx` (texto seleccionado)
Barra fina (h-12, `border-b bg-card`, centrada) que aparece con animación suave cuando hay una anotación de texto seleccionada:
- Select de fuente (Helvetica / Times / Courier, cada opción renderizada con su fuente).
- Tamaño: select con 8–72 (8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72) + botones `−`/`+`.
- ToggleGroup múltiple: **B**, *I*, U (iconos `Bold`, `Italic`, `Underline`).
- ToggleGroup simple de alineación (`AlignLeft`, `AlignCenter`, `AlignRight`).
- Color: Popover con 10 swatches predefinidos (negro tinta, gris, blanco, rojo coral, naranja, amarillo, verde, azul cielo, azul fuerte, morado) + `<input type="color">` para personalizado.
- Botón eliminar (`Trash2`, destructive ghost).
- Cada cambio = `updateAnnotation` inmediato (1 entrada de historial). Tras cambiar `fontSize`/`fontFamily` recalcular altura.
- Usar `onMouseDown={e => e.preventDefault()}` en los controles para no hacer blur de la textarea mientras se edita.

## 4. Exportación
Implementar `drawTextAnnotation` en `pdf-export.ts` según `00-CONTEXTO.md` (wrap, alineación, baseline, subrayado, rotación de página, saneo WinAnsi). El wrap debe partir palabras más largas que el ancho.

## Checklist
- [ ] Crear texto, escribir con acentos y ñ, cambiar todos los estilos; mover y cambiar ancho.
- [ ] Ctrl+Z dentro de la textarea deshace texto (nativo); fuera de ella deshace la última acción del editor.
- [ ] Supr con un texto seleccionado (sin editar) lo borra; Ctrl+Z lo restaura.
- [ ] Con zoom 50 % y 200 % el texto conserva posición y proporción.
- [ ] Descargar: el texto aparece en la misma posición, tamaño, color, estilo y saltos de línea (tolerancia de pocos px). Probar también en una página horizontal o rotada.
- [ ] build + lint OK. Commit "feat: texto".
