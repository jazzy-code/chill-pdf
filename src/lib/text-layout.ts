import { cssFontFamily } from '@/lib/fonts';
import type { TextAnnotation } from '@/types/editor';

export const LINE_HEIGHT = 1.2;

type Measure = (s: string) => number;

/**
 * Single line-breaking algorithm shared by the screen and the PDF export, so both wrap the same way.
 * Splits on '\n', then word-wraps against maxWidth; words longer than the width are broken by character.
 */
export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line === '' ? word : `${line} ${word}`;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line !== '') lines.push(line);
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      // word wider than the box → break it by characters
      let chunk = '';
      for (const ch of Array.from(word)) {
        if (chunk !== '' && measure(chunk + ch) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines;
}

export type TextStyle = Pick<
  TextAnnotation,
  'fontFamily' | 'fontSize' | 'bold' | 'italic' | 'underline' | 'color' | 'align'
>;

let measureCtx: CanvasRenderingContext2D | null = null;

/** Width in PDF points (= CSS px at zoom 1) using the on-screen font. */
function screenMeasure(style: Pick<TextStyle, 'fontFamily' | 'fontSize' | 'bold' | 'italic'>): Measure {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  const ctx = measureCtx!;
  const font = `${style.italic ? 'italic' : 'normal'} ${style.bold ? 'bold' : 'normal'} 100px ${cssFontFamily(style.fontFamily)}`;
  const k = style.fontSize / 100;
  return (s) => {
    ctx.font = font;
    return ctx.measureText(s).width * k;
  };
}

/** Lines and height (PDF points) of a text annotation as shown on screen. */
export function layoutText(
  a: Pick<TextAnnotation, 'text' | 'width' | 'fontFamily' | 'fontSize' | 'bold' | 'italic'>
) {
  const lines = wrapText(a.text, a.width, screenMeasure(a));
  return { lines, height: Math.max(1, lines.length) * a.fontSize * LINE_HEIGHT };
}
