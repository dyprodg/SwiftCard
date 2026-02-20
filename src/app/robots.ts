import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/admin/",
          "/*/checkout/",
          "/*/cart",
          "/*/account/",
          "/*/order/",
          "/api/",
          "/*/maintenance",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
