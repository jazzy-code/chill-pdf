# F2 · Historial, eliminar y reordenar páginas (prioridades 2 y 4)

## 1. Undo / Redo
- Botones de la toolbar conectados a `useEditorStore.temporal.getState().undo()/redo()`, habilitados según `pastStates.length` / `futureStates.length` (suscripción con `useStore(useEditorStore.temporal, selector)` de `zustand`).
- `hooks/useKeyboardShortcuts.ts` (montado en `Editor`):
  - `Ctrl/Cmd+Z` → undo; `Ctrl/Cmd+Y` o `Ctrl/Cmd+Shift+Z` → redo.
  - `Supr`/`Backspace` → elimina la anotación seleccionada (F4/F5).
  - `Esc` → deselecciona y vuelve a `tool: 'select'`.
  - **Ignorar todos** si `document.activeElement` es `input`, `textarea`, `select` o `[contenteditable]` (para que Ctrl+Z dentro de un texto funcione nativo).
  - `preventDefault()` cuando se maneja el atajo.
- Después de undo/redo: limpiar `selectedId` si la anotación ya no existe; si `activePageId` ya no existe, usar la primera página.

## 2. Eliminar página
- En `PageThumbnail`: botón papelera arriba-derecha, `opacity-0 group-hover:opacity-100`, `onClick` con `e.stopPropagation()` (y `onPointerDown` con `stopPropagation` para no iniciar drag).
- `deletePage(id)`: quitar de `pages` y quitar sus anotaciones, en un solo `set` (= una entrada de historial). Si es la última página → toast "El PDF necesita al menos una página" y no borrar.
- Toast "Página eliminada" con acción **Deshacer** → `undo()`.

## 3. Reordenar con drag & drop (@dnd-kit)
En `PagesSidebar`:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), // permite click sin arrastrar
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={...} onDragEnd={({active, over}) => over && active.id !== over.id && movePage(String(active.id), String(over.id))}>
  <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
    {pages.map((p, i) => <PageThumbnail key={p.id} page={p} index={i} />)}
  </SortableContext>
  <DragOverlay>{activeId ? <ThumbnailPreview .../> : null}</DragOverlay>
</DndContext>
```
- `PageThumbnail` usa `useSortable({ id: page.id })`, aplica `transform: CSS.Transform.toString(transform)`, `transition`, y `opacity-50` cuando `isDragging`.
- `movePage` usa `arrayMove` de `@dnd-kit/sortable` → una sola entrada de historial por drop.
- El visor se reordena automáticamente porque renderiza desde `pages`. Las anotaciones siguen a su página porque se ligan por `pageId`.
- Los números de página reflejan el nuevo orden.

## Checklist
- [ ] Borrar 3 páginas y Ctrl+Z ×3 las restaura en su posición original; Ctrl+Y las vuelve a borrar.
- [ ] Arrastrar una miniatura reordena sidebar y visor; Ctrl+Z la regresa.
- [ ] Click simple en miniatura sigue navegando (no inicia drag).
- [ ] Papelera solo visible en hover; no se puede borrar la última página.
- [ ] build + lint OK. Commit "feat: historial, eliminar y reordenar".
