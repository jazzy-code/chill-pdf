# 01 · Guía de diseño

Tono: **divertido, alegre y limpio**. Llamativo pero nunca saturado. La herramienta debe sentirse fácil.

## Tokens (en `src/app/globals.css`, sobre las variables de shadcn)
Los colores finales aún no están decididos → TODO color pasa por variables CSS para poder cambiar la paleta en un solo lugar. **Nunca** usar colores hardcodeados de Tailwind (`bg-blue-400`) en componentes; usar `bg-primary`, `bg-accent`, `bg-muted`, etc.

Paleta inicial (modo claro únicamente; no implementar dark mode):
```css
:root {
  --radius: 1rem;
  --background: oklch(0.985 0.008 230);   /* blanco azulado muy suave */
  --foreground: oklch(0.25 0.03 250);     /* azul tinta, no negro puro */
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.72 0.13 230);        /* azul cielo (principal) */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.95 0.03 230);      /* azul muy claro para superficies */
  --secondary-foreground: oklch(0.35 0.06 240);
  --accent: oklch(0.93 0.11 95);          /* amarillo mantequilla (acentos, hovers alegres) */
  --accent-foreground: oklch(0.35 0.06 70);
  --muted: oklch(0.96 0.01 230);
  --muted-foreground: oklch(0.55 0.03 240);
  --destructive: oklch(0.65 0.2 20);      /* coral */
  --border: oklch(0.91 0.02 230);
  --input: oklch(0.91 0.02 230);
  --ring: oklch(0.72 0.13 230);
}
```
Mantener el resto de variables que genere shadcn; solo sobrescribir estas.

## Tipografía (next/font/google)
- Títulos y logo: **Fredoka** (600/700) → variable `--font-display`, clase utilitaria `font-display`.
- UI/cuerpo: **Nunito** (400/600/700) → `--font-sans`.

## Estilo de componentes
- Radios generosos (`rounded-xl`/`rounded-2xl`), sombras suaves (`shadow-sm`, en hover `shadow-md`).
- Botones de toolbar: `variant="ghost"` con icono lucide + etiqueta corta; activo = `bg-secondary text-secondary-foreground`.
- Botón Descargar: `size="lg"`, `bg-primary`, `rounded-full`, icono `Download`, con micro-animación en hover (`hover:-translate-y-0.5 transition`).
- Tooltips de shadcn en todos los botones solo-icono, incluyendo el atajo (ej. "Deshacer (Ctrl+Z)").
- Visor: fondo `bg-muted`; páginas en blanco con `shadow-md rounded-sm` y `gap-6` entre ellas.
- Miniaturas: tarjeta blanca, número de página debajo, borde `ring-2 ring-primary` en la activa, overlay sutil en hover, papelera arriba-derecha en círculo blanco con icono `Trash2` en `text-destructive`.
- Durante el drag: la miniatura arrastrada con `opacity-50` y `scale-105 shadow-lg` en el overlay.
- Anotación seleccionada: borde punteado `outline-dashed outline-2 outline-primary` y handles circulares blancos con borde primario.

## Landing (Dropzone)
- Centrado vertical, logo "Chill PDF" grande en Fredoka con un pequeño emoji/ícono relajado (ej. 😎 o icono `FileText` en un blob amarillo).
- Subtítulo: "Edita tus PDF sin estrés.  Elimina páginas, reordena, fusiona, inserta texto, imagenes y más.
- Zona de drop: tarjeta grande `border-2 border-dashed border-primary/40 rounded-3xl bg-card`, al hacer drag-over cambia a `bg-accent/40 border-primary scale-[1.01]`.
- Botón grande "Selecciona tu archivo" + texto "o suéltalo aquí". Acepta múltiples PDFs (se fusionan en el orden elegido).
- 3 mini "chips" con las funciones: Eliminar páginas · Reordenar · Texto e imágenes.
- Formas decorativas suaves (2–3 blobs con `blur-3xl` en primary/accent al 30 % de opacidad) en el fondo. Nada más.

## Microinteracciones
- Toasts (sonner) para: PDF cargado, páginas añadidas, página eliminada (con botón "Deshacer" que llama a undo), descarga lista, errores.
- Transiciones de 150–200 ms. Nada de animaciones largas.
