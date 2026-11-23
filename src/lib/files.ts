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

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMAGE_SIDE = 2000;

export const isImageFile = (file: File) => file.type.startsWith('image/');

export interface NormalizedImage {
  src: string;
  mime: 'image/png' | 'image/jpeg';
  naturalWidth: number;
  naturalHeight: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/**
 * Re-encodes any image as PNG or JPEG (the only formats pdf-lib embeds), downscaling if huge.
 * Always goes through a canvas so EXIF orientation is baked into the pixels.
 */
export async function normalizeImage(file: File): Promise<NormalizedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return {
      src: canvas.toDataURL(mime, 0.92),
      mime,
      naturalWidth: w,
      naturalHeight: h,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Opens the native file picker. Resolves with [] if the user cancels. */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.addEventListener('change', () => resolve(Array.from(input.files ?? [])), { once: true });
    input.addEventListener('cancel', () => resolve([]), { once: true });
    input.click();
  });
}

export function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
