import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O upload da planilha de fornecedor usa Server Action
      // (`<form action={...}>`), e o Next.js limita o corpo dessas requisições
      // a 1 MB por padrão — qualquer planilha real estourava esse teto antes
      // mesmo da action executar.
      //
      // "4.2mb" = 4.404.019 bytes (o Next interpreta "mb" em base binária).
      // Esse número foi escolhido para ficar ENTRE dois outros limites:
      //
      //   4.300.000 B  regra de negócio
      //                (features/fornecedores/constants/importacao-arquivo.ts)
      //   4.404.019 B  este bodySizeLimit
      //   4.500.000 B  teto de infraestrutura da Vercel (não configurável)
      //
      // A folga acima da regra de negócio é intencional: um arquivo pouco maior
      // que o permitido ainda chega na Server Action e recebe uma mensagem
      // amigável, em vez de ser cortado pelo framework com um 413 cru.
      // Ficar abaixo do teto da Vercel mantém o comportamento igual em
      // desenvolvimento e em produção.
      bodySizeLimit: "4.2mb",
    },
  },
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
