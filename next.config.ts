import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;