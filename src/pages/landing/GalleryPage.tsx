import { GalleryGrid, type GalleryPhoto } from "@/components/landing/GalleryGrid";
import type { Site } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function GalleryPage() {
  const state = useApiData<{ site: Site; photos: GalleryPhoto[]; categories: string[] }>("/api/public/gallery");

  return (
    <DataGate state={state}>
      {({ site, photos, categories }) => (
        <div className="mx-auto max-w-6xl px-4 py-4 md:py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-brand uppercase">Dokumentasi Visual</p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-gray-900 md:text-3xl">Galeri Kegiatan & Pelatihan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Dokumentasi pelaksanaan kegiatan pelatihan, registrasi barcode, dan suasana pos checkpoint acara di {site.name}.
            </p>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <GalleryGrid photos={photos} categories={categories} />
          </div>
        </div>
      )}
    </DataGate>
  );
}

