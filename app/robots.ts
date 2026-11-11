import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Halaman publik dan gambar (/media) boleh diindeks; panel, akun, tiket, sertifikat, dan API tidak.
// /superadmin sengaja tidak disebut (robots.txt bisa dibaca siapa saja); halamannya memakai meta noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/tiket", "/akun", "/sertifikat", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
