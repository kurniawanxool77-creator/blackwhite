import type { MetadataRoute } from "next";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

// Konfigurasi Web App (PWA) agar dapat dipasang di layar utama ponsel peserta.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite();
  return {
    name: site.name,
    short_name: site.name.length > 12 ? site.name.slice(0, 12) : site.name,
    description: site.tagline,
    lang: "id",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#15803d",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Tiket Saya",
        url: "/dashboard",
        description: "Buka E-Pass dan QR presensi kegiatan",
      },
      {
        name: "Katalog Pelatihan",
        url: "/event",
        description: "Cari jadwal dan daftar pelatihan",
      },
    ],
  };
}
