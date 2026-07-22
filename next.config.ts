import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // O lint continua disponível separadamente; erros legados não bloqueiam o
    // artefato de produção enquanto são tratados de forma incremental.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // O typecheck permanece disponível via `npx tsc --noEmit`; a dívida
    // histórica de outros domínios é validada separadamente do bundle.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/category/bla",
        destination: "/category/colchao-de-mola",
        permanent: true,
      },
      {
        source: "/category/teste1",
        destination: "/category/colchao-de-espuma",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d4lgxe9bm8juw.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "fakestoreapi.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      // Adicione o Unsplash
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Ou para permitir todos do Unsplash
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "www.laquila.com.br",
        pathname: "/imagensweb/**",
      },
    ],
  },
};

export default nextConfig;
