// Alamat publik situs untuk tautan absolut (sitemap, canonical, Open Graph, data terstruktur).
// Isi SITE_URL di .env saat online; bila kosong memakai NEXTAUTH_URL atau domain Vercel otomatis.
const isLocal = (u?: string) => Boolean(u && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(u));

export const siteUrl = () => {
  const nextAuth = process.env.VERCEL === "1" && isLocal(process.env.NEXTAUTH_URL) ? "" : process.env.NEXTAUTH_URL;
  const url =
    process.env.SITE_URL ||
    nextAuth ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:5173";
  return url.replace(/\/$/, "");
};

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`);

// Deskripsi untuk meta tag: teks polos, satu baris, maks. ~160 karakter.
export function metaDescription(text: string, fallback: string) {
  const t = (text || fallback).replace(/\s+/g, " ").trim();
  return t.length > 160 ? `${t.slice(0, 157).trimEnd()}...` : t;
}

// <script type="application/ld+json"> aman: "<" di-escape agar isi tidak bisa menutup tag script.
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
