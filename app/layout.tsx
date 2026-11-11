import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { metaDescription, siteUrl } from "@/lib/seo";
import { getSite } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const viewport: Viewport = { themeColor: "#15803d", width: "device-width", initialScale: 1, viewportFit: "cover" };

// SEO dasar: judul tiap halaman "Halaman | L-Event", deskripsi, dan Open Graph (pratinjau WhatsApp/Facebook).
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const description = metaDescription(site.tagline, "Pelatihan bersertifikat dengan pendaftaran online dan absensi QR.");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${site.name} — Pelatihan Bersertifikat, Seminar & Workshop`, template: `%s | ${site.name}` },
    description,
    applicationName: site.name,
    keywords: ["pelatihan", "pelatihan bersertifikat", "seminar", "workshop", "sertifikat", "daftar pelatihan online", "absensi QR", site.name],
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: site.name,
      title: site.name,
      description,
      images: site.heroImage ? [{ url: site.heroImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title: site.name, description },
    appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
