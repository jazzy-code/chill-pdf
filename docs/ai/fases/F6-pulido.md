# F6 · Pulido final

Hacer SOLO lo de esta lista; nada de features nuevas.

1. **Aviso al salir**: `beforeunload` con `preventDefault()` si hay historial (`pastStates.length > 0`).
2. **Persistencia de sesión (opcional pero recomendada)**: guardar `{ sources, pages, annotations, fileName }` en IndexedDB con `idb-keyval` (`npm i idb-keyval`), debounce 1 s tras cada cambio. Al abrir la app, si existe sesión guardada, mostrar en la landing una tarjeta "Continuar editando «nombre.pdf»" + "Empezar de nuevo" (que borra la sesión). No usar localStorage/sessionStorage para los bytes (límite de 5 MB). `reset()` también borra la sesión.
3. **Atajos visibles**: tooltips con atajo en todos los botones; `Ctrl+S` → descargar (preventDefault).
4. **Estados vacíos y errores**: mensajes claros en toasts; spinner en miniaturas mientras renderizan.
5. **Rendimiento**: `React.memo` en `PageThumbnail`, `PageView`, `TextAnnotation`, `ImageAnnotation`; selectores finos de Zustand (`useShallow` donde se devuelvan objetos/arrays); verificar que mover una anotación no re-renderiza todos los canvas.
6. **Responsive mínimo**: en pantallas < 768px ocultar las etiquetas de texto de la toolbar (solo iconos) y reducir la sidebar a `w-28`. No hace falta más.
7. **Accesibilidad básica**: `aria-label` en botones solo-icono, foco visible (`focus-visible:ring`).
8. Favicon simple (SVG con las iniciales o un icono de documento en color primario) y metadata.

## Checklist final
- [ ] Recorrer de nuevo los checklists de F1–F5 rápidamente.
- [ ] Recargar la página con un documento abierto → aparece "Continuar editando" y restaura todo.
- [ ] build + lint OK. Commit "chore: pulido".
