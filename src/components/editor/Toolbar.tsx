'use client';
import type { ReactElement, ReactNode } from 'react';
import {
  ChevronDown,
  Download,
  FilePlus2,
  FileText,
  ImagePlus,
  Minus,
  MoveHorizontal,
  Plus,
  Redo2,
  Type,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VIEWER_ID } from '@/components/editor/Viewer';
import { useStore } from 'zustand';
import { redo, undo, useEditorStore } from '@/store/editor-store';

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function WithTooltip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolButton({
  icon,
  label,
  tooltip,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tooltip: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <WithTooltip label={tooltip}>
      <Button variant="ghost" className="rounded-xl" disabled={disabled} onClick={onClick}>
        {icon}
        <span className="hidden lg:inline">{label}</span>
      </Button>
    </WithTooltip>
  );
}

function IconButton({
  icon,
  tooltip,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  tooltip: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <WithTooltip label={tooltip}>
      <Button
        variant="ghost"
        size="icon-lg"
        className="rounded-xl"
        aria-label={tooltip}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </Button>
    </WithTooltip>
  );
}

export function fitToWidth() {
  const { pages, setZoom } = useEditorStore.getState();
  const viewer = document.getElementById(VIEWER_ID);
  if (!viewer || pages.length === 0) return;
  const maxWidth = Math.max(...pages.map((p) => p.width));
  // floor so rounding never adds a horizontal scrollbar
  setZoom(Math.floor(((viewer.clientWidth - 64) / maxWidth) * 100) / 100);
}

export default function Toolbar() {
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const reset = useEditorStore((s) => s.reset);
  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);

  const closeDocument = () => {
    if (window.confirm('¿Cerrar este documento? Perderás los cambios')) reset();
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4">
      <button
        type="button"
        onClick={closeDocument}
        className="flex items-center gap-2 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Chill PDF: cerrar documento"
      >
        <span className="flex size-9 -rotate-6 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <FileText className="size-5" />
        </span>
        <span className="hidden font-display text-xl font-bold sm:inline">Chill PDF</span>
      </button>

      <div className="flex flex-1 items-center justify-center gap-1">
        <ToolButton icon={<FilePlus2 />} label="Añadir PDF" tooltip="Añadir PDF" disabled />
        <ToolButton icon={<Type />} label="Texto" tooltip="Añadir texto" disabled />
        <ToolButton icon={<ImagePlus />} label="Imagen" tooltip="Añadir imagen" disabled />

        <Separator orientation="vertical" className="mx-2 h-6!" />

        <IconButton icon={<Undo2 />} tooltip="Deshacer (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
        <IconButton icon={<Redo2 />} tooltip="Rehacer (Ctrl+Y)" disabled={!canRedo} onClick={redo} />

        <Separator orientation="vertical" className="mx-2 h-6!" />

        <IconButton
          icon={<Minus />}
          tooltip="Alejar (Ctrl+rueda)"
          disabled={zoom <= 0.25}
          onClick={() => setZoom(zoom - 0.1)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="w-20 rounded-xl tabular-nums" aria-label="Nivel de zoom">
                {Math.round(zoom * 100)}%
                <ChevronDown className="text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="center" className="w-44">
            {ZOOM_PRESETS.map((z) => (
              <DropdownMenuItem key={z} onClick={() => setZoom(z)}>
                {z * 100}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={fitToWidth}>
              <MoveHorizontal />
              Ajustar al ancho
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconButton
          icon={<Plus />}
          tooltip="Acercar (Ctrl+rueda)"
          disabled={zoom >= 3}
          onClick={() => setZoom(zoom + 0.1)}
        />
      </div>

      <Button
        size="lg"
        className="h-11 rounded-full px-6 font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        disabled
      >
        <Download />
        <span className="hidden sm:inline">Descargar</span>
      </Button>
    </header>
  );
}
