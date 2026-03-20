import "./globals.css";
import "./admin-dashboard.css";

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/react-query";
import { CategoriesProvider } from "@/providers/categories-provider";

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
  title: {
    default: "Do Rocha | Sua Loja Virtual",
    template: "%s | Do Rocha", // páginas filhas: "Produto X | Do Rocha"
  },
  description:
    "Encontre os melhores produtos com qualidade, garantia e entrega rápida na Do Rocha. Frete grátis acima de R$ 299.",
  keywords: ["loja virtual", "e-commerce", "produtos", "entrega rápida", "frete grátis"],
  authors: [{ name: "Do Rocha" }],
  creator: "Do Rocha",
  // Open Graph — aparência ao compartilhar no WhatsApp, Facebook etc.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Do Rocha",
    title: "Do Rocha | Sua Loja Virtual",
    description: "Encontre os melhores produtos com qualidade e entrega rápida.",
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
    { media: "(prefers-color-scheme: dark)",  color: "#0C447C" },
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased min-h-screen flex flex-col
          bg-background text-foreground
        `}
      >
        <CategoriesProvider>
          <ReactQueryProvider>
            {children}

            {/* Toaster — notificações globais alinhadas ao design system */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  success: "bg-[#14B8A6] text-white border-none",   // teal — sucesso
                  error:   "bg-[#DC2626] text-white border-none",   // vermelho — erro
                  warning: "bg-[#EF9F27] text-white border-none",   // âmbar — atenção
                  info:    "bg-[#0C447C] text-white border-none",   // azul — info
                },
              }}
            />
          </ReactQueryProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}