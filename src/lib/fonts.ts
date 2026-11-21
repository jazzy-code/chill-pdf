import type { StandardFonts } from 'pdf-lib';
import type { FontFamily } from '@/types/editor';

export const FONT_OPTIONS: { value: FontFamily; label: string; css: string }[] = [
  { value: 'helvetica', label: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
  { value: 'times', label: 'Times', css: '"Times New Roman", Times, serif' },
  { value: 'courier', label: 'Courier', css: '"Courier New", Courier, monospace' },
];

export const cssFontFamily = (family: FontFamily) =>
  FONT_OPTIONS.find((f) => f.value === family)!.css;

/**
 * Baseline position inside a line box of height 1.2em, measured from the line top, in em.
 * = half-leading + ascent of the screen font (Arial / Times New Roman / Courier New),
 * so the exported baseline matches what CSS draws.
 */
export const BASELINE_EM: Record<FontFamily, number> = {
  helvetica: (1.2 - (0.905 + 0.212)) / 2 + 0.905,
  times: (1.2 - (0.891 + 0.216)) / 2 + 0.891,
  courier: (1.2 - (0.833 + 0.3)) / 2 + 0.833,
};

/** Distance from baseline to the underline, in em (close to the CSS default). */
export const UNDERLINE_OFFSET_EM = 0.12;

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
