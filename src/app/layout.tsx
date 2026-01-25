import "./globals.css";
import "./admin-dashboard.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/react-query";
import { CategoriesProvider } from "@/providers/categories-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// APENAS MUDANÇA AQUI ↓ - Metadata atualizada
export const metadata: Metadata = {
  title: "Do Rocha | Sua Loja Virtual",
  description: "Encontre os melhores produtos com qualidade e entrega rápida na Do Rocha",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CategoriesProvider>
          <ReactQueryProvider>
            {children}           
            
            <Toaster
              toastOptions={{
                classNames: {
                  success: "bg-green-500 text-white",
                  error: "bg-red-500 text-white",
                },
              }}
            />
            
          </ReactQueryProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}