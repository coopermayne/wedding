import type { MetadataRoute } from "next";

// Defense-in-depth alongside the `noindex` on the admin page: keep crawlers
// out of /admin entirely. Everything else is fair game.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
  };
}
