'use client';
import type { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  Annotation,
  ImageAnnotation,
  PageItem,
  SourceDoc,
  TextAnnotation,
} from '@/types/editor';

type PdfLib = typeof import('pdf-lib');

export interface DrawContext {
  lib: PdfLib;
  doc: PDFDocument;
  page: PDFPage;
  fonts: Map<string, Promise<PDFFont>>;   // cache by StandardFonts name
  images: Map<string, Promise<PDFImage>>; // cache by dataURL
}

export class EncryptedSourceError extends Error {
  constructor(public fileName: string) {
    super(`Encrypted source: ${fileName}`);
    this.name = 'EncryptedSourceError';
  }
}

/** Implemented in F4. */
export async function drawTextAnnotation(ctx: DrawContext, a: TextAnnotation): Promise<void> {
  void ctx;
  void a;
}

/** Implemented in F5. */
export async function drawImageAnnotation(ctx: DrawContext, a: ImageAnnotation): Promise<void> {
  void ctx;
  void a;
}

export async function exportPdf(
  pages: PageItem[],
  annotations: Annotation[],
  sources: Record<string, SourceDoc>
): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const out = await lib.PDFDocument.create();

  // Load each used source once
  const loaded = new Map<string, PDFDocument>();
  for (const sourceId of new Set(pages.map((p) => p.sourceId))) {
    const source = sources[sourceId];
    const doc = await lib.PDFDocument.load(source.bytes, { ignoreEncryption: true });
    // Copying pages from an encrypted file produces unreadable output → fail clearly
    if (doc.isEncrypted) throw new EncryptedSourceError(source.name);
    loaded.set(sourceId, doc);
  }

  // Copy pages grouped by source (efficient), then add them in the final order
  const copied = new Map<string, PDFPage>();
  for (const [sourceId, doc] of loaded) {
    const indices = [...new Set(pages.filter((p) => p.sourceId === sourceId).map((p) => p.sourceIndex))];
    const result = await out.copyPages(doc, indices);
    indices.forEach((index, k) => copied.set(`${sourceId}:${index}`, result[k]));
  }

  const used = new Set<string>();
  const fonts = new Map<string, Promise<PDFFont>>();
  const images = new Map<string, Promise<PDFImage>>();

  for (const item of pages) {
    const key = `${item.sourceId}:${item.sourceIndex}`;
    let page = copied.get(key)!;
    if (used.has(key)) {
      // the same source page appears twice → needs its own copy
      [page] = await out.copyPages(loaded.get(item.sourceId)!, [item.sourceIndex]);
    }
    used.add(key);
    out.addPage(page);

    const ctx: DrawContext = { lib, doc: out, page, fonts, images };
    for (const a of annotations) {
      if (a.pageId !== item.id) continue;
      if (a.type === 'text') await drawTextAnnotation(ctx, a);
      else await drawImageAnnotation(ctx, a);
    }
  }

  return out.save();
}
