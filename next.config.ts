import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
