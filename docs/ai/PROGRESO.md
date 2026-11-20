# Progreso

Marca `[x]` al terminar cada fase (build + lint OK + checklist verificado) y agrega notas cortas.

- [x] F0 · Setup
- [ ] F1 · Landing y visor
- [ ] F2 · Historial, eliminar, reordenar
- [ ] F3 · Fusionar y exportar
- [ ] F4 · Texto
- [ ] F5 · Imágenes
- [ ] F6 · Pulido

## Notas / desviaciones
- **F0**: Next.js 16.4.6 + React 19.3 + Tailwind 4.3. El template trae `cacheComponents` y `partialPrefetching` activos en `next.config.ts` (se dejaron; ojo con `next/dynamic` y `ssr:false` en F1). El template genera `AGENTS.md` ("Next.js con cambios incompatibles: leer `node_modules/next/dist/docs/`"), que se descartó; `next dev` puede volver a crearlo.
- **F0**: shadcn usa el estilo `base-nova` (Base UI, no Radix): las APIs de los componentes pueden diferir de los ejemplos clásicos (p. ej. `render` en vez de `asChild`).
- **F0**: se conservó `@custom-variant dark (&:is(.dark *))` y se quitó el bloque `.dark`, así las clases `dark:` de shadcn no se activan con el modo oscuro del sistema. `<Toaster theme="light">` porque no hay ThemeProvider.
- **F0**: `.claude/launch.json` añadido para el servidor de desarrollo (preview).
