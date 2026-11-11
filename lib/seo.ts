// Alamat publik situs untuk tautan absolut (sitemap, canonical, Open Graph, data terstruktur).
// Isi SITE_URL di .env saat online (mis. https://levent.co.id); bila kosong memakai NEXTAUTH_URL.
export const siteUrl = () => (process.env.SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`);

// Deskripsi untuk meta tag: teks polos, satu baris, maks. ~160 karakter.
export function metaDescription(text: string, fallback: string) {
  const t = (text || fallback).replace(/\s+/g, " ").trim();
  return t.length > 160 ? `${t.slice(0, 157).trimEnd()}...` : t;
}

// <script type="application/ld+json"> aman: "<" di-escape agar isi tidak bisa menutup tag script.
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
