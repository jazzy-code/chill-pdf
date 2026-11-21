import type { StandardFonts } from 'pdf-lib';
import type { FontFamily } from '@/types/editor';

export const FONT_OPTIONS: { value: FontFamily; label: string; css: string }[] = [
  { value: 'helvetica', label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { value: 'times', label: 'Times', css: '"Times New Roman", Times, serif' },
  { value: 'courier', label: 'Courier', css: '"Courier New", Courier, monospace' },
];

export const cssFontFamily = (family: FontFamily) =>
  FONT_OPTIONS.find((f) => f.value === family)!.css;

// Values of pdf-lib's StandardFonts enum (kept as strings so pdf-lib isn't bundled eagerly).
const STANDARD_FONTS: Record<FontFamily, [regular: string, bold: string, italic: string, boldItalic: string]> = {
  helvetica: ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'],
  times: ['Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic'],
  courier: ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique'],
};

export function standardFontFor(family: FontFamily, bold: boolean, italic: boolean): StandardFonts {
  const [regular, b, i, bi] = STANDARD_FONTS[family];
  return (bold && italic ? bi : bold ? b : italic ? i : regular) as StandardFonts;
}
