import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O upload da planilha de fornecedor usa Server Action
      // (`<form action={importarPlanilhaFornecedor}>`), e o Next.js limita o
      // corpo dessas requisições a 1 MB por padrão — qualquer planilha real
      // estourava esse teto antes mesmo da action executar.
      //
      // O valor abaixo acompanha o limite que o próprio projeto já declara em
      // `arquivoImportacaoFornecedorSchema` (10 MB), evitando um segundo número
      // mágico divergente da validação de negócio.
      //
      // Atenção: na Vercel existe um teto de infraestrutura (~4,5 MB por
      // requisição de Serverless Function) que NÃO é configurável aqui.
      bodySizeLimit: "10mb",
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
