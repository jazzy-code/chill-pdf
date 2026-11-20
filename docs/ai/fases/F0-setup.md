# F0 · Setup del proyecto

Objetivo: proyecto Next.js funcionando en la RAÍZ de esta carpeta, con shadcn, dependencias y tema.

## Pasos
1. La carpeta ya contiene `docs/` y `CLAUDE.md`, así que `create-next-app` se queja. Hacer scaffold en una subcarpeta temporal y mover:
   ```bash
   pnpm create next-app@latest chill-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm --skip-install --yes
   ```
   Mover todo el contenido de `chill-tmp/` (incluidos archivos ocultos como `.gitignore`) a la raíz y borrar `chill-tmp/`. No sobrescribir `CLAUDE.md` ni `docs/`. Si el scaffold genera `README.md` o `AGENTS.md`/`CLAUDE.md` propios, descartarlos (conservar los nuestros). En `package.json` poner `"name": "chill-pdf"`.
2. `pnpm install`
3. Dependencias:
   ```bash
   pnpm add pdfjs-dist pdf-lib zustand zundo @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-rnd react-image-crop nanoid
   ```
4. shadcn:
   ```bash
   pnpm dlx shadcn@latest init -d
   pnpm dlx shadcn@latest add button tooltip dropdown-menu popover select toggle toggle-group separator dialog slider sonner input
   ```
5. Tema: aplicar tokens y fuentes de `01-DISENO.md` en `globals.css` y `layout.tsx` (`lang="es"`, metadata title "Chill PDF — Editor de PDF", `<Toaster richColors position="bottom-center" />`, `<TooltipProvider>` envolviendo `children`).
6. Crear `src/types/editor.ts` exactamente como en `00-CONTEXTO.md`.
7. Limpiar el `page.tsx` de ejemplo y los SVG de `public/` del template.
8. `git init` y commit inicial "chore: setup" (si git está disponible).

## Checklist
- [ ] `pnpm dev` muestra una página vacía con fondo del tema y fuente Nunito.
- [ ] `pnpm build` y `pnpm lint` pasan.
