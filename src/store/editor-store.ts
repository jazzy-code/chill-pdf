'use client';
import { create } from 'zustand';
import { temporal } from 'zundo';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import {
  baseName,
  downloadBytes,
  IMAGE_ACCEPT,
  isImageFile,
  isPdfFile,
  normalizeImage,
  pickFiles,
  readPdfFile,
  type NormalizedImage,
} from '@/lib/files';
import { clearPdfCache, evictPdfDocs } from '@/lib/pdfjs';
import type { TextStyle } from '@/lib/text-layout';
import type { Annotation, PageItem, SourceDoc } from '@/types/editor';

export type Tool = 'select' | 'text';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const clampZoom = (z: number) =>
  Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) * 100) / 100;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'helvetica',
  fontSize: 16,
  bold: false,
  italic: false,
  underline: false,
  color: '#1f2937',
  align: 'left',
};

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
  editingId: string | null;   // text annotation in edit mode
  croppingId: string | null;  // image annotation open in the crop dialog
  lastTextStyle: TextStyle;   // style for the next new text

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
  setEditing: (id: string | null) => void;
  setCropping: (id: string | null) => void;
  reorderAnnotation: (id: string, to: 'front' | 'back') => void;
  setLastTextStyle: (patch: Partial<TextStyle>) => void;
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
  editingId: null as string | null,
  croppingId: null as string | null,
  lastTextStyle: DEFAULT_TEXT_STYLE,
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
          editingId: null,
          croppingId: null,
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
          editingId: get().editingId === id ? null : get().editingId,
          croppingId: get().croppingId === id ? null : get().croppingId,
        }),

      setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
      setTool: (tool) => set({ tool }),
      select: (selectedId) => set({ selectedId }),
      setActivePage: (activePageId) => set({ activePageId }),
      setEditing: (editingId) => set({ editingId }),
      setCropping: (croppingId) => set({ croppingId }),

      // Array order = z-order on screen and drawing order in the export
      reorderAnnotation: (id, to) => {
        const list = get().annotations;
        const a = list.find((x) => x.id === id);
        if (!a) return;
        const rest = list.filter((x) => x.id !== id);
        const next = to === 'front' ? [...rest, a] : [a, ...rest];
        if (next.every((x, i) => x === list[i])) return; // already there → no history entry
        set({ annotations: next });
      },
      setLastTextStyle: (patch) => set({ lastTextStyle: { ...get().lastTextStyle, ...patch } }),

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
  if (s.editingId && !s.annotations.some((a) => a.id === s.editingId)) patch.editingId = null;
  if (s.croppingId && !s.annotations.some((a) => a.id === s.croppingId)) patch.croppingId = null;
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

/**
 * Inserts an image on a page. Without a point it is centered on the page;
 * with a point (PDF points, page coordinates) it is centered there. Fits 50 % of the page width.
 */
export async function insertImage(file: File, pageId?: string, point?: { x: number; y: number }) {
  const state = useEditorStore.getState();
  const page = state.pages.find((p) => p.id === (pageId ?? state.activePageId)) ?? state.pages[0];
  if (!page) return;
  if (!isImageFile(file)) {
    toast.error('Ese archivo no es una imagen', { description: 'Usa PNG, JPEG, WEBP o GIF.' });
    return;
  }
  let img: NormalizedImage;
  try {
    img = await normalizeImage(file);
  } catch {
    toast.error(`No pudimos abrir ${file.name}`);
    return;
  }
  const ratio = img.naturalHeight / img.naturalWidth;
  let width = page.width * 0.5;
  let height = width * ratio;
  if (height > page.height * 0.8) {
    height = page.height * 0.8;
    width = height / ratio;
  }
  const cx = point?.x ?? page.width / 2;
  const cy = point?.y ?? page.height / 2;
  const x = Math.max(0, Math.min(cx - width / 2, page.width - width));
  const y = Math.max(0, Math.min(cy - height / 2, page.height - height));
  const id = nanoid();
  state.addAnnotation({
    id,
    type: 'image',
    pageId: page.id,
    x,
    y,
    width,
    height,
    src: img.src,
    originalSrc: img.src,
    mime: img.mime,
  });
  state.setTool('select');
}

export async function pickAndInsertImage() {
  const [file] = await pickFiles(IMAGE_ACCEPT);
  if (file) await insertImage(file);
}

/** Replaces an image keeping its position and width (height follows the new proportions). */
export async function pickAndReplaceImage(id: string) {
  const [file] = await pickFiles(IMAGE_ACCEPT);
  if (!file) return;
  const { annotations, updateAnnotation } = useEditorStore.getState();
  const a = annotations.find((x) => x.id === id);
  if (!a || a.type !== 'image') return;
  try {
    const img = await normalizeImage(file);
    updateAnnotation(id, {
      src: img.src,
      originalSrc: img.src,
      mime: img.mime,
      crop: undefined,
      height: a.width * (img.naturalHeight / img.naturalWidth),
    });
  } catch {
    toast.error(`No pudimos abrir ${file.name}`);
  }
}
