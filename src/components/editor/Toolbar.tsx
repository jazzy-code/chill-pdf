'use client';
import { useState, type ReactElement, type ReactNode } from 'react';
import {
  ChevronDown,
  Download,
  FilePlus2,
  FileText,
  ImagePlus,
  Loader2,
  Minus,
  MoveHorizontal,
  Plus,
  Redo2,
  SquarePlus,
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
import NewDocumentDialog from '@/components/editor/NewDocumentDialog';
import { VIEWER_ID } from '@/components/editor/Viewer';
import { useStore } from 'zustand';
import { cn } from '@/lib/utils';
import {
  downloadDocument,
  pickAndAppendPdfs,
  pickAndInsertImage,
  redo,
  undo,
  useEditorStore,
} from '@/store/editor-store';

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
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tooltip: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <WithTooltip label={tooltip}>
      <Button
        variant="ghost"
        className={cn(
          'rounded-xl',
          active && 'bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground'
        )}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
      >
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
  className,
  onClick,
}: {
  icon: ReactNode;
  tooltip: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <WithTooltip label={tooltip}>
      <Button
        variant="ghost"
        size="icon-lg"
        className={cn('rounded-xl', className)}
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
  const isExporting = useEditorStore((s) => s.isExporting);
  const tool = useEditorStore((s) => s.tool);
  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);

  // Always confirm: a restored session has edits even with an empty undo history
  const [confirmNew, setConfirmNew] = useState(false);
  const startOver = () => setConfirmNew(true);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={startOver}
        className="hidden shrink-0 items-center gap-2 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        aria-label="Chill PDF: empezar con otro documento"
      >
        <span className="flex size-9 -rotate-6 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <FileText className="size-5" />
        </span>
        <span className="hidden font-display text-xl font-bold sm:inline">Chill PDF</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center-safe gap-1 overflow-x-auto [scrollbar-width:none]">
        <ToolButton
          icon={<FilePlus2 />}
          label="Añadir PDF"
          tooltip="Añadir PDF al final"
          onClick={pickAndAppendPdfs}
        />
        <ToolButton
          icon={<Type />}
          label="Texto"
          tooltip={tool === 'text' ? 'Haz clic en una página para escribir (Esc cancela)' : 'Añadir texto'}
          active={tool === 'text'}
          onClick={() => {
            const s = useEditorStore.getState();
            s.select(null);
            s.setTool(s.tool === 'text' ? 'select' : 'text');
          }}
        />
        <ToolButton
          icon={<ImagePlus />}
          label="Imagen"
          tooltip="Añadir imagen (o suéltala sobre una página)"
          onClick={pickAndInsertImage}
        />

        <Separator orientation="vertical" className="mx-2 hidden h-6! sm:block" />

        <IconButton icon={<Undo2 />} tooltip="Deshacer (Ctrl+Z)" disabled={!canUndo} onClick={undo} />
        <IconButton icon={<Redo2 />} tooltip="Rehacer (Ctrl+Y)" disabled={!canRedo} onClick={redo} />

        <Separator orientation="vertical" className="mx-2 hidden h-6! sm:block" />

        <IconButton
          icon={<Minus />}
          tooltip="Alejar (Ctrl+rueda)"
          className="hidden sm:inline-flex"
          disabled={zoom <= 0.25}
          onClick={() => setZoom(zoom - 0.1)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="w-20 shrink-0 rounded-xl tabular-nums" aria-label="Nivel de zoom">
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
          className="hidden sm:inline-flex"
          disabled={zoom >= 3}
          onClick={() => setZoom(zoom + 0.1)}
        />
      </div>

      <WithTooltip label="Cerrar este documento y empezar con otro">
        <Button
          variant="outline"
          className="h-11 shrink-0 rounded-full px-4 font-semibold"
          aria-label="Nuevo documento"
          onClick={startOver}
        >
          <SquarePlus />
          <span className="hidden xl:inline">Nuevo</span>
        </Button>
      </WithTooltip>

      <WithTooltip label="Descargar PDF (Ctrl+S)">
      <Button
        size="lg"
        className="h-11 shrink-0 rounded-full px-4 font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:px-6"
        aria-label="Descargar PDF"
        disabled={isExporting}
        onClick={downloadDocument}
      >
        {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
        <span className="hidden sm:inline">{isExporting ? 'Preparando…' : 'Descargar'}</span>
      </Button>
      </WithTooltip>

      <NewDocumentDialog open={confirmNew} onOpenChange={setConfirmNew} />
    </header>
  );
}
