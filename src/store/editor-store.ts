'use client';
import { create } from 'zustand';
import { temporal } from 'zundo';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { baseName, downloadBytes, isPdfFile, pickFiles, readPdfFile } from '@/lib/files';
import { clearPdfCache, evictPdfDocs } from '@/lib/pdfjs';
import type { Annotation, PageItem, SourceDoc } from '@/types/editor';

export type Tool = 'select' | 'text';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const clampZoom = (z: number) =>
  Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) * 100) / 100;

export interface EditorState {
  // --- with history (zundo) ---
  pages: PageItem[];
  annotations: Annotation[];
  // --- without history ---
  sources: Record<string, SourceDoc>;
  fileName: string;
  zoom: number;
  selectedId: string | null;
  tool: Tool;
  activePageId: string | null;
  isExporting: boolean;

  loadFiles: (files: File[]) => Promise<boolean>;
  appendFiles: (files: File[]) => Promise<boolean>;
  deletePage: (id: string) => boolean;
  movePage: (activeId: string, overId: string) => void;
  addAnnotation: (a: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setZoom: (zoom: number) => void;
  setTool: (tool: Tool) => void;
  select: (id: string | null) => void;
  setActivePage: (id: string | null) => void;
  reset: () => void;
}

type ReadResult = Awaited<ReturnType<typeof readPdfFile>>;

async function readFiles(files: File[]): Promise<ReadResult[]> {
  const pdfs = files.filter(isPdfFile);
  if (pdfs.length === 0) {
    toast.error('Eso no parece un PDF', { description: 'Prueba con un archivo .pdf' });
    return [];
  }
  const skipped = files.length - pdfs.length;
  if (skipped > 0) {
    toast.warning(
      skipped === 1 ? 'Ignoramos 1 archivo que no es PDF' : `Ignoramos ${skipped} archivos que no son PDF`
    );
  }

  const results: ReadResult[] = [];
  for (const file of pdfs) {
    try {
      results.push(await readPdfFile(file));
    } catch {
      toast.error(`No pudimos abrir ${file.name}`, {
        description: 'Puede estar dañado o protegido con contraseña.',
      });
    }
  }
  return results;
}

const initialData = {
  pages: [] as PageItem[],
  annotations: [] as Annotation[],
  sources: {} as Record<string, SourceDoc>,
  fileName: 'documento',
  zoom: 1,
  selectedId: null as string | null,
  tool: 'select' as Tool,
  activePageId: null as string | null,
  isExporting: false,
};

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      ...initialData,

      loadFiles: async (files) => {
        const results = await readFiles(files);
        if (results.length === 0) return false;

        const sources: Record<string, SourceDoc> = {};
        results.forEach((r) => (sources[r.source.id] = r.source));
        const pages = results.flatMap((r) => r.pages);

        // Replacing the document: free pdfjs docs from the previous one.
        evictPdfDocs(Object.keys(get().sources));
        set({
          sources,
          pages,
          annotations: [],
          fileName: baseName(results[0].source.name),
          selectedId: null,
          tool: 'select',
          activePageId: pages[0]?.id ?? null,
        });
        useEditorStore.temporal.getState().clear();

        const count = pages.length;
        toast.success(results.length > 1 ? `${results.length} PDF cargados` : 'PDF cargado', {
          description: `${count} ${count === 1 ? 'página' : 'páginas'} listas para editar.`,
        });
        return true;
      },

      appendFiles: async (files) => {
        const results = await readFiles(files);
        if (results.length === 0) return false;

        const sources = { ...get().sources };
        results.forEach((r) => (sources[r.source.id] = r.source));
        const added = results.flatMap((r) => r.pages);
        set({ sources, pages: [...get().pages, ...added] });

        const n = added.length;
        const from =
          results.length === 1 ? results[0].source.name : `${results.length} archivos`;
        toast.success(`Se añadieron ${n} ${n === 1 ? 'página' : 'páginas'} de ${from}`, {
          action: { label: 'Deshacer', onClick: undo },
        });
        return true;
      },

      deletePage: (id) => {
        const { pages, annotations, activePageId, selectedId } = get();
        if (pages.length <= 1) {
          toast.error('El PDF necesita al menos una página');
          return false;
        }
        const index = pages.findIndex((p) => p.id === id);
        if (index === -1) return false;

        const nextPages = pages.filter((p) => p.id !== id);
        const nextAnnotations = annotations.filter((a) => a.pageId !== id);
        set({
          pages: nextPages,
          annotations: nextAnnotations,
          activePageId:
            activePageId === id ? nextPages[Math.min(index, nextPages.length - 1)].id : activePageId,
          selectedId: nextAnnotations.some((a) => a.id === selectedId) ? selectedId : null,
        });
        toast('Página eliminada', { action: { label: 'Deshacer', onClick: undo } });
        return true;
      },

      movePage: (activeId, overId) => {
        const { pages } = get();
        const from = pages.findIndex((p) => p.id === activeId);
        const to = pages.findIndex((p) => p.id === overId);
        if (from === -1 || to === -1 || from === to) return;
        set({ pages: arrayMove(pages, from, to) });
      },

      addAnnotation: (a) => set({ annotations: [...get().annotations, a], selectedId: a.id }),

      updateAnnotation: (id, patch) =>
        set({
          annotations: get().annotations.map((a) =>
            a.id === id ? ({ ...a, ...patch } as Annotation) : a
          ),
        }),

      removeAnnotation: (id) =>
        set({
          annotations: get().annotations.filter((a) => a.id !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        }),

      setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
      setTool: (tool) => set({ tool }),
      select: (selectedId) => set({ selectedId }),
      setActivePage: (activePageId) => set({ activePageId }),

      reset: () => {
        clearPdfCache();
        set({ ...initialData });
        useEditorStore.temporal.getState().clear();
      },
    }),
    {
      partialize: (s) => ({ pages: s.pages, annotations: s.annotations }),
      limit: 100,
      equality: (a, b) => a.pages === b.pages && a.annotations === b.annotations,
    }
  )
);

// After undo/redo: drop references to things that no longer exist.
function syncAfterTimeTravel() {
  const s = useEditorStore.getState();
  const patch: Partial<EditorState> = {};
  if (s.selectedId && !s.annotations.some((a) => a.id === s.selectedId)) patch.selectedId = null;
  if (!s.pages.some((p) => p.id === s.activePageId)) patch.activePageId = s.pages[0]?.id ?? null;
  if (Object.keys(patch).length) useEditorStore.setState(patch);
}

export function undo() {
  useEditorStore.temporal.getState().undo();
  syncAfterTimeTravel();
}

export function redo() {
  useEditorStore.temporal.getState().redo();
  syncAfterTimeTravel();
}

export async function pickAndAppendPdfs() {
  const files = await pickFiles('application/pdf,.pdf', true);
  if (files.length) await useEditorStore.getState().appendFiles(files);
}

export async function downloadDocument() {
  const { pages, annotations, sources, fileName, isExporting } = useEditorStore.getState();
  if (isExporting || pages.length === 0) return;
  useEditorStore.setState({ isExporting: true });
  try {
    const { exportPdf } = await import('@/lib/pdf-export');
    const bytes = await exportPdf(pages, annotations, sources);
    downloadBytes(bytes, `${fileName}-editado.pdf`);
    toast.success('¡Tu PDF está listo!', { description: `${fileName}-editado.pdf` });
  } catch (err) {
    console.error(err);
    if ((err as Error)?.name === 'EncryptedSourceError') {
      const name = (err as Error & { fileName: string }).fileName;
      toast.error(`No podemos exportar «${name}»`, {
        description: 'El archivo está cifrado o protegido. Quita la protección e inténtalo de nuevo.',
      });
    } else {
      toast.error('No pudimos generar el PDF', { description: 'Inténtalo de nuevo.' });
    }
  } finally {
    useEditorStore.setState({ isExporting: false });
  }
}
