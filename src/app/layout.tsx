import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const DESCRIPTION =
  "Edita tus PDF sin estrés. Elimina páginas, reordena, fusiona, inserta texto, imagenes y más.";

export const metadata: Metadata = {
  title: "Chill PDF — Editor de PDF",
  description: DESCRIPTION,
  applicationName: "Chill PDF",
  // square versions of the mascot (public/icon.png), generated so they don't clash with /icon.png
  icons: {
    icon: { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  keywords: ["editor PDF", "unir PDF", "reordenar páginas", "eliminar páginas", "añadir texto a PDF"],
  openGraph: {
    title: "Chill PDF — Editor de PDF",
    description: DESCRIPTION,
    type: "website",
    locale: "es_ES",
  },
};

// browser UI color = theme --primary (metadata can't read CSS variables)
export const viewport: Viewport = { themeColor: "#32b3e6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" richColors position="bottom-center" />
      </body>
    </html>
  );
}
