import type { MetadataRoute } from "next";

import { montarUrlAbsoluta } from "@/lib/seo/url-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Googlebot-Image",
          "Bingbot",
          "OAI-SearchBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Applebot",
        ],
        allow: "/",
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        disallow: "/",
      },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: montarUrlAbsoluta("/sitemap.xml"),
  };
}
