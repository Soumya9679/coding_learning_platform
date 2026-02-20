import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pulsepy.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/settings/", "/profile/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
