'use client';
import { nanoid } from 'nanoid';
import { getPdfDoc } from '@/lib/pdfjs';
import type { PageItem, SourceDoc } from '@/types/editor';

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function baseName(fileName: string) {
  return fileName.replace(/\.pdf$/i, '');
}

const normalizeRotation = (r: number) =>
  (((Math.round(r / 90) * 90) % 360) + 360) % 360 as PageItem['rotation'];

export async function readPdfFile(file: File): Promise<{ source: SourceDoc; pages: PageItem[] }> {
  const id = nanoid();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await getPdfDoc({ id, bytes });

  const pages: PageItem[] = [];
  for (let i = 0; i < doc.numPages; i++) {
    const p = await doc.getPage(i + 1);
    const vp = p.getViewport({ scale: 1 });
    pages.push({
      id: nanoid(),
      sourceId: id,
      sourceIndex: i,
      width: vp.width,
      height: vp.height,
      rotation: normalizeRotation(p.rotate),
    });
  }

  return { source: { id, name: file.name, bytes, pageCount: doc.numPages }, pages };
}
