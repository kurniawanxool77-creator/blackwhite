import type { Metadata } from "next";
import { GalleryGrid, type GalleryPhoto } from "@/components/landing/GalleryGrid";
import { db } from "@/lib/db";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeri Dokumentasi",
  description: "Dokumentasi visual rangkaian pelatihan, seminar, dan checkpoint kegiatan resmi.",
};

export default async function GaleriPage() {
  const [site, events] = await Promise.all([
    getSite(),
    db.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        coverUrl: true,
        gallery: true,
      },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const photos: GalleryPhoto[] = [];
  const categoriesSet = new Set<string>();

  for (const e of events) {
    if (e.category) categoriesSet.add(e.category);

    if (e.coverUrl) {
      photos.push({
        url: e.coverUrl,
        eventName: e.name,
        category: e.category,
        slug: e.slug,
      });
    }

    try {
      const extra: string[] = JSON.parse(e.gallery || "[]");
      for (const url of extra) {
        if (url && typeof url === "string") {
          photos.push({
            url,
            eventName: e.name,
            category: e.category,
            slug: e.slug,
          });
        }
      }
    } catch {
      // Abaikan jika format JSON tidak valid
    }
  }

  const categories = Array.from(categoriesSet);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wider text-brand uppercase">Dokumentasi Visual</p>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-gray-900 md:text-3xl">
          Galeri Kegiatan & Pelatihan
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Dokumentasi pelaksanaan kegiatan pelatihan, registrasi barcode, dan suasana pos checkpoint acara di {site.name}.
        </p>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <GalleryGrid photos={photos} categories={categories} />
      </div>
    </div>
  );
}
