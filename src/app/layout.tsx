import "./globals.css";
import "./admin-dashboard.css";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { ContextoCepLogisticaProvider } from "@/features/logistica/components/store/contexto-cep-logistica-provider";
import { obterUrlBaseSite } from "@/lib/seo/url-site";
import { CategoriesProvider } from "@/providers/categories-provider";
import ReactQueryProvider from "@/providers/react-query";

// ─── Fontes ───────────────────────────────────────────────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // melhora CLS — texto aparece na fonte fallback antes de carregar
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ─── Metadata — SEO e compartilhamento social ─────────────────────────────────
export const metadata: Metadata = {
  // Base usada pelo Next.js para transformar caminhos relativos (canonical,
  // Open Graph) em URLs absolutas. Vem da configuração única do projeto.
  metadataBase: new URL(obterUrlBaseSite()),
  title: {
    default: "Do Rocha | Sua Loja Virtual",
    template: "%s | Do Rocha", // páginas filhas: "Produto X | Do Rocha"
  },
  description:
    "Encontre os melhores produtos com qualidade, garantia e entrega rápida na Do Rocha. Frete grátis acima de R$ 299.",
  keywords: [
    "loja virtual",
    "e-commerce",
    "produtos",
    "entrega rápida",
    "frete grátis",
  ],
  authors: [{ name: "Do Rocha" }],
  creator: "Do Rocha",
  // Open Graph — aparência ao compartilhar no WhatsApp, Facebook etc.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Do Rocha",
    title: "Do Rocha | Sua Loja Virtual",
    description:
      "Encontre os melhores produtos com qualidade e entrega rápida.",
  },
  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

// ─── Viewport — cores da barra do navegador mobile ────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0C447C" }, // azul primário
    { media: "(prefers-color-scheme: dark)", color: "#0C447C" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Layout raiz ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-screen flex-col antialiased">
        <CategoriesProvider>
          <ReactQueryProvider>
            <ContextoCepLogisticaProvider>
              {children}
            </ContextoCepLogisticaProvider>

            {/* Toaster — notificações globais alinhadas ao design system */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  success: "border-none bg-success text-white",
                  error: "border-none bg-destructive text-white",
                  warning: "border-none bg-warning text-warning-foreground",
                  info: "border-none bg-info text-info-foreground",
                },
              }}
            />
          </ReactQueryProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}
