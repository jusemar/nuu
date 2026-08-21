import type { MetadataRoute } from "next";

import { montarUrlAbsoluta } from "@/lib/seo/url-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: montarUrlAbsoluta("/sitemap.xml"),
  };
}
