import { ChevronDown, Download, FileUp, ShieldCheck, Sparkles } from 'lucide-react';
import { AUTHOR } from '@/lib/site';

const STEPS = [
  {
    icon: FileUp,
    title: 'Sube tu PDF',
    text: 'Elige uno o varios archivos, o arrástralos a la página. Si son varios, se unen en un solo documento.',
  },
  {
    icon: Sparkles,
    title: 'Edítalo a tu gusto',
    text: 'Reordena páginas arrastrando las miniaturas, elimina las que sobran y añade texto o imágenes donde quieras.',
  },
  {
    icon: Download,
    title: 'Descárgalo',
    text: 'Pulsa «Descargar» y obtén tu PDF listo, sin marcas de agua y con la calidad original.',
  },
];

const FAQ = [
  {
    q: '¿Chill PDF es gratis?',
    a: 'Sí. Puedes editar y descargar tus PDF gratis, sin registrarte y sin marcas de agua.',
  },
  {
    q: '¿Mis archivos se suben a algún servidor?',
    a: 'No. Todo el trabajo ocurre dentro de tu navegador: tus documentos nunca salen de tu dispositivo, así que son privados.',
  },
  {
    q: '¿Puedo unir varios PDF en uno?',
    a: 'Sí. Selecciona varios archivos a la vez o usa «Añadir PDF» en el editor; después puedes reordenar todas las páginas como quieras.',
  },
  {
    q: '¿Cómo agrego texto o imágenes a un PDF?',
    a: 'Elige la herramienta «Texto» y haz clic en la página para escribir, o «Imagen» para insertar una foto o logo. Puedes moverlos, cambiar su tamaño, la fuente y el color.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Sí. Chill PDF funciona en el navegador de tu computadora, tableta o celular, sin instalar nada.',
  },
  {
    q: '¿Qué pasa si cierro la pestaña sin descargar?',
    a: 'Tu trabajo se guarda automáticamente en tu navegador; al volver podrás continuar donde lo dejaste.',
  },
];

/** Static info under the upload area: explains the tool (and gives search engines real content). */
export default function LandingInfo() {
  return (
    <>
      <section aria-labelledby="how-title" className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 id="how-title" className="text-center font-display text-3xl font-bold md:text-4xl">
            Edita tu PDF en 3 pasos
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {i + 1}. {title}
                </h3>
                <p className="mt-2 text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 flex max-w-xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Privado por diseño: tus archivos se procesan en tu dispositivo y nunca se suben a internet.
          </p>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="px-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <h2 id="faq-title" className="text-center font-display text-3xl font-bold md:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl bg-card px-5 py-4 shadow-sm ring-1 ring-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  <h3>{q}</h3>
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        Chill PDF · Hecho con cariño por{' '}
        <a href={AUTHOR.url} className="font-semibold text-primary hover:underline">
          {AUTHOR.name}
        </a>
      </footer>
    </>
  );
}
