'use client';
import { useRef, useState, type DragEvent } from 'react';
import { ArrowUpDown, FileText, Loader2, Trash2, Type, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';

const FEATURES = [
  { icon: Trash2, label: 'Eliminar páginas' },
  { icon: ArrowUpDown, label: 'Reordenar' },
  { icon: Type, label: 'Texto e imágenes' },
];

export default function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadFiles = useEditorStore((s) => s.loadFiles);

  const open = async (files: File[]) => {
    if (loading || files.length === 0) return;
    setLoading(true);
    try {
      await loadFiles(files);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragging) setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    open(Array.from(e.dataTransfer.files));
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-32 size-[28rem] rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-40 size-[30rem] rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 size-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative w-full max-w-2xl text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-14 -rotate-6 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
            <FileText className="size-8" />
          </span>
          <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">Chill PDF</h1>
        </div>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          Edita tus PDF sin estrés. Todo pasa en tu navegador, nada se sube a ningún servidor.
        </p>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'mt-10 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 shadow-sm transition-all duration-200',
            dragging ? 'scale-[1.01] border-primary bg-accent/40' : 'border-primary/40 bg-card'
          )}
        >
          <Button
            size="lg"
            className="h-14 rounded-full px-8 text-base font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
            {loading ? 'Abriendo tu PDF…' : 'Selecciona tu archivo'}
          </Button>
          <p className="font-semibold text-muted-foreground">o suéltalo aquí</p>
          <p className="text-sm text-muted-foreground">
            Puedes elegir varios PDF: se unirán en el orden elegido.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              open(files);
            }}
          />
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground"
            >
              <Icon className="size-4" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
