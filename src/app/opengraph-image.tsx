import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND, SITE_NAME } from '@/lib/site';

// Preview image for links shared on WhatsApp, Facebook, X, LinkedIn… (generated at build time)
export const alt = 'Chill PDF — Editor de PDF online gratis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLE = SITE_NAME;
const TAGLINE = 'Editor de PDF online gratis';
const BLURB = 'Une, reordena y elimina páginas. Añade texto e imágenes. Sin registro.';

/** Brand font (TTF subset with only the needed glyphs); null → ImageResponse's default font. */
async function googleFont(family: string, weight: number, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [fredoka, nunito] = await Promise.all([
    googleFont('Fredoka', 700, TITLE + TAGLINE),
    googleFont('Nunito', 600, BLURB),
  ]);
  const fonts = [
    ...(fredoka ? [{ name: 'Fredoka', data: fredoka, weight: 700 as const, style: 'normal' as const }] : []),
    ...(nunito ? [{ name: 'Nunito', data: nunito, weight: 600 as const, style: 'normal' as const }] : []),
  ];
  const mascot = await readFile(join(process.cwd(), 'public/icon.png'));
  const mascotSrc = `data:image/png;base64,${mascot.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 64,
          background: BRAND.background,
          color: BRAND.foreground,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 320, height: 320 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: BRAND.accent,
              borderRadius: 64,
              transform: 'rotate(-6deg)',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only supports <img> */}
          <img src={mascotSrc} width={244} height={207} alt="" style={{ position: 'relative' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div style={{ fontFamily: 'Fredoka', fontSize: 112, fontWeight: 700 }}>{TITLE}</div>
          <div style={{ fontFamily: 'Fredoka', fontSize: 48, color: BRAND.primary, fontWeight: 700 }}>
            {TAGLINE}
          </div>
          <div style={{ fontFamily: 'Nunito', fontSize: 34, fontWeight: 600, color: BRAND.muted, marginTop: 24, lineHeight: 1.35 }}>
            {BLURB}
          </div>
        </div>
      </div>
    ),
    fonts.length ? { ...size, fonts } : size
  );
}
