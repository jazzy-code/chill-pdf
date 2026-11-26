import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AUTHOR, BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  // square versions of the mascot (public/icon.png), generated so they don't clash with /icon.png
  icons: {
    icon: { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  keywords: [
    "Chill PDF",
    "editor PDF online",
    "editar PDF gratis",
    "unir PDF",
    "reordenar páginas PDF",
    "eliminar páginas PDF",
    "añadir texto a PDF",
    "insertar imagen en PDF",
  ],
  // og:image / twitter:image come from app/opengraph-image.tsx
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: "website",
    locale: "es_MX",
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
};

// browser UI color = theme --primary (metadata can't read CSS variables)
export const viewport: Viewport = { themeColor: BRAND.primary };

// Structured data: tells Google the site name ("Chill PDF") and that it's a free web app
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, alternateName: 'ChillPDF', url: SITE_URL, inLanguage: 'es' },
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Cualquiera (navegador web)',
      browserRequirements: 'Requiere JavaScript',
      inLanguage: 'es',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      creator: { '@type': 'Organization', name: AUTHOR.name, url: AUTHOR.url },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" richColors position="bottom-center" />
      </body>
    </html>
  );
}
