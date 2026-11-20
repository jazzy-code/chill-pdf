# Chill PDF · Instrucciones para el agente ejecutor

Eres el desarrollador que implementa Chill PDF. El diseño técnico ya está decidido: **ejecuta, no rediseñes**.

## Orden de lectura
1. `00-CONTEXTO.md` — stack, arquitectura, modelo de datos, store, patrones obligatorios (pdfjs, export, coordenadas). Léelo SIEMPRE completo antes de trabajar.
2. `01-DISENO.md` — tokens, tipografía y estilo visual.
3. `PROGRESO.md` — qué fases están hechas. Continúa con la primera fase sin marcar.
4. La fase actual en `fases/` (lee solo la que vas a ejecutar).

## Fases
| Fase | Archivo | Entrega |
|---|---|---|
| F0 | `fases/F0-setup.md` | Proyecto Next + shadcn + tema |
| F1 | `fases/F1-landing-y-visor.md` | Landing, carga, visor, miniaturas, zoom |
| F2 | `fases/F2-historial-eliminar-reordenar.md` | Undo/redo, eliminar, drag & drop |
| F3 | `fases/F3-fusionar-y-exportar.md` | Fusionar PDFs, descargar |
| F4 | `fases/F4-texto.md` | Texto con estilos |
| F5 | `fases/F5-imagenes.md` | Imágenes: mover, redimensionar, recortar |
| F6 | `fases/F6-pulido.md` | Persistencia, atajos, rendimiento |

## Reglas de ejecución
- Implementa una fase completa, luego `npm run build` + `npm run lint`; corrige hasta que pasen.
- Verifica el checklist de la fase con `npm run dev` (en el navegador si tienes herramientas de navegador; si no, revisa la lógica con cuidado).
- Marca la fase en `PROGRESO.md` (con notas breves de desviaciones o pendientes) y haz commit con el mensaje indicado.
- **No** escribas tests, mocks, Storybook ni documentación adicional. **No** instales librerías fuera del stack salvo que una fase lo indique; si algo del stack no funciona, usa la alternativa mínima y anótalo en `PROGRESO.md`.
- Si una instrucción choca con la realidad de una librería (API cambiada en una versión nueva), adapta lo mínimo respetando la intención y anótalo.
- Sé eficiente: no leas archivos que no necesitas, no reescribas archivos completos para cambios pequeños, no expliques de más.
- Al terminar una fase, sigue con la siguiente si el usuario pidió ejecutar todo; si no, detente y resume en 3–5 líneas.
