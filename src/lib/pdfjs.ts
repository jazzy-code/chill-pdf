'use client';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
export function getPdfDoc(source: { id: string; bytes: Uint8Array }) {
  let p = docCache.get(source.id);
  if (!p) {
    // pdfjs transfers (detaches) the buffer → always pass a copy
    p = getPdfjs().then((pdfjs) => pdfjs.getDocument({ data: source.bytes.slice() }).promise);
    // never cache a failed load
    p.catch(() => docCache.delete(source.id));
    docCache.set(source.id, p);
  }
  return p;
}

export function evictPdfDocs(ids: string[]) {
  for (const id of ids) {
    docCache.get(id)?.then((d) => d.loadingTask.destroy()).catch(() => {});
    docCache.delete(id);
  }
}

export function clearPdfCache() {
  docCache.forEach((p) => p.then((d) => d.loadingTask.destroy()).catch(() => {}));
  docCache.clear();
}
