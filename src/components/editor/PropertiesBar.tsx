'use client';
import { useCallback, useEffect, useRef, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Minus,
  Plus,
  Trash2,
  Underline,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FONT_OPTIONS } from '@/lib/fonts';
import { layoutText, type TextStyle } from '@/lib/text-layout';
import { useEditorStore } from '@/store/editor-store';
import type { FontFamily, TextAlign, TextAnnotation } from '@/types/editor';

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72];
const MIN_SIZE = 6;
const MAX_SIZE = 144;

// Content colors for the user's text (data, not UI theme colors)
const SWATCHES = [
  { value: '#1f2937', label: 'Negro tinta' },
  { value: '#6b7280', label: 'Gris' },
  { value: '#ffffff', label: 'Blanco' },
  { value: '#f05d5e', label: 'Rojo coral' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#facc15', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#38bdf8', label: 'Azul cielo' },
  { value: '#2563eb', label: 'Azul fuerte' },
  { value: '#8b5cf6', label: 'Morado' },
];

// Keep the textarea focused while clicking toolbar controls
const keepFocus = (e: MouseEvent) => e.preventDefault();

function Tip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function PropertiesBar() {
  const selected = useEditorStore((s) =>
    s.annotations.find((a) => a.id === s.selectedId && a.type === 'text')
  ) as TextAnnotation | undefined;

  if (!selected) return null;
  return <TextProperties a={selected} />;
}

function TextProperties({ a }: { a: TextAnnotation }) {
  /** One history entry per change; height is recomputed in the same update. */
  const apply = (patch: Partial<TextStyle>) => {
    const { updateAnnotation, setLastTextStyle, annotations } = useEditorStore.getState();
    const current = annotations.find((x) => x.id === a.id) as TextAnnotation | undefined;
    if (!current) return;
    const next = { ...current, ...patch };
    updateAnnotation(a.id, { ...patch, height: layoutText(next).height });
    setLastTextStyle(patch);
  };

  // <input type="color">: React's onChange fires continuously while picking; commit only on the
  // native "change". The input lives in the popover, so attach the listener when it mounts.
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });
  const colorInputRef = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    const onChange = () => applyRef.current({ color: el.value });
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }, []);

  const styles = [a.bold && 'bold', a.italic && 'italic', a.underline && 'underline'].filter(
    Boolean
  ) as string[];

  return (
    <div
      role="toolbar"
      aria-label="Propiedades del texto"
      className="flex h-12 shrink-0 items-center justify-center gap-2 overflow-x-auto border-b bg-card px-4 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <Select
        value={a.fontFamily}
        onValueChange={(v) => v && apply({ fontFamily: v as FontFamily })}
        items={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
      >
        <SelectTrigger size="sm" className="w-32" aria-label="Fuente">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.css }}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center">
        <Tip label="Reducir tamaño">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reducir tamaño"
            disabled={a.fontSize <= MIN_SIZE}
            onMouseDown={keepFocus}
            onClick={() => apply({ fontSize: Math.max(MIN_SIZE, a.fontSize - 1) })}
          >
            <Minus />
          </Button>
        </Tip>
        <Select
          value={a.fontSize}
          onValueChange={(v) => v && apply({ fontSize: Number(v) })}
        >
          <SelectTrigger size="sm" className="w-18 tabular-nums" aria-label="Tamaño de fuente">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tip label="Aumentar tamaño">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Aumentar tamaño"
            disabled={a.fontSize >= MAX_SIZE}
            onMouseDown={keepFocus}
            onClick={() => apply({ fontSize: Math.min(MAX_SIZE, a.fontSize + 1) })}
          >
            <Plus />
          </Button>
        </Tip>
      </div>

      <Separator orientation="vertical" className="h-6!" />

      <ToggleGroup
        multiple
        size="sm"
        value={styles}
        onValueChange={(v) =>
          apply({ bold: v.includes('bold'), italic: v.includes('italic'), underline: v.includes('underline') })
        }
        aria-label="Estilo"
      >
        <ToggleGroupItem value="bold" aria-label="Negrita" onMouseDown={keepFocus}>
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Cursiva" onMouseDown={keepFocus}>
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Subrayado" onMouseDown={keepFocus}>
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6!" />

      <ToggleGroup
        size="sm"
        value={[a.align]}
        onValueChange={(v) => v[0] && apply({ align: v[0] as TextAlign })}
        aria-label="Alineación"
      >
        <ToggleGroupItem value="left" aria-label="Alinear a la izquierda" onMouseDown={keepFocus}>
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centrar" onMouseDown={keepFocus}>
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinear a la derecha" onMouseDown={keepFocus}>
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6!" />

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Color del texto">
              <span
                className="size-5 rounded-full ring-1 ring-border ring-offset-1"
                style={{ backgroundColor: a.color }}
              />
            </Button>
          }
        />
        <PopoverContent className="w-auto" align="center">
          <div className="grid grid-cols-5 gap-2">
            {SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.label}
                aria-label={s.label}
                aria-pressed={a.color.toLowerCase() === s.value}
                onClick={() => apply({ color: s.value })}
                className="size-7 rounded-full ring-1 ring-border transition-transform duration-150 outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2"
                style={{ backgroundColor: s.value }}
              />
            ))}
          </div>
          <label className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
            Personalizado
            <input
              ref={colorInputRef}
              type="color"
              defaultValue={a.color}
              key={a.color}
              className="h-7 w-12 cursor-pointer rounded-md border bg-transparent"
            />
          </label>
        </PopoverContent>
      </Popover>

      <Tip label="Eliminar texto (Supr)">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Eliminar texto"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onMouseDown={keepFocus}
          onClick={() => useEditorStore.getState().removeAnnotation(a.id)}
        >
          <Trash2 />
        </Button>
      </Tip>
    </div>
  );
}
