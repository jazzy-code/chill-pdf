import type { MetadataRoute } from 'next';
import { BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: 'es',
    start_url: '/',
    display: 'standalone',
    background_color: BRAND.background,
    theme_color: BRAND.primary,
    icons: [
      { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
