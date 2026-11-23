'use client';
import type { PDFDocument, PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { pageRotation, toPdfPoint } from '@/lib/coords';
import { BASELINE_EM, standardFontFor, UNDERLINE_OFFSET_EM } from '@/lib/fonts';
import { LINE_HEIGHT, wrapText } from '@/lib/text-layout';
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

function hexToRgb(lib: PdfLib, hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16) || 0;
  return lib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Standard fonts only support WinAnsi: replace anything not encodable with "?". */
function sanitize(font: PDFFont, text: string) {
  return text
    .replace(/\t/g, ' ')
    .split('\n')
    .map((line) =>
      Array.from(line)
        .map((ch) => {
          try {
            font.encodeText(ch);
            return ch;
          } catch {
            return '?';
          }
        })
        .join('')
    )
    .join('\n');
}

export async function drawTextAnnotation(ctx: DrawContext, a: TextAnnotation): Promise<void> {
  const { lib, doc, page } = ctx;
  const fontName = standardFontFor(a.fontFamily, a.bold, a.italic);
  let fontPromise = ctx.fonts.get(fontName);
  if (!fontPromise) {
    fontPromise = doc.embedFont(fontName);
    ctx.fonts.set(fontName, fontPromise);
  }
  const font = await fontPromise;

  const size = a.fontSize;
  const measure = (s: string) => font.widthOfTextAtSize(s, size);
  const lines = wrapText(sanitize(font, a.text), a.width, measure);
  const lineHeight = size * LINE_HEIGHT;
  const color = hexToRgb(lib, a.color);
  const rotate = lib.degrees(pageRotation(page));

  lines.forEach((line, i) => {
    if (line.trim() === '') return;
    const lineWidth = measure(line);
    const offsetX =
      a.align === 'center' ? (a.width - lineWidth) / 2 : a.align === 'right' ? a.width - lineWidth : 0;
    const x = a.x + offsetX;
    const baseline = a.y + i * lineHeight + size * BASELINE_EM[a.fontFamily];

    const p = toPdfPoint(page, x, baseline);
    page.drawText(line, { x: p.x, y: p.y, size, font, color, rotate });

    if (a.underline) {
      const uy = baseline + size * UNDERLINE_OFFSET_EM;
      page.drawLine({
        start: toPdfPoint(page, x, uy),
        end: toPdfPoint(page, x + lineWidth, uy),
        thickness: size / 15,
        color,
      });
    }
  });
}

export async function drawImageAnnotation(ctx: DrawContext, a: ImageAnnotation): Promise<void> {
  const { lib, doc, page } = ctx;
  let imagePromise = ctx.images.get(a.src);
  if (!imagePromise) {
    // pdf-lib accepts data URIs directly
    imagePromise = a.mime === 'image/jpeg' ? doc.embedJpg(a.src) : doc.embedPng(a.src);
    ctx.images.set(a.src, imagePromise);
  }
  const image = await imagePromise;

  // anchor = bottom-left corner as seen on screen; rotation follows the page's own rotation
  const p = toPdfPoint(page, a.x, a.y + a.height);
  page.drawImage(image, {
    x: p.x,
    y: p.y,
    width: a.width,
    height: a.height,
    rotate: lib.degrees(pageRotation(page)),
  });
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
