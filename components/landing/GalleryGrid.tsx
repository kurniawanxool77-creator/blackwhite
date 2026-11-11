"use client";

import { useCallback, useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";

export type GalleryPhoto = {
  url: string;
  eventName: string;
  category: string;
  slug: string;
};

const chip = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
    active ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-700 hover:border-gray-900"
  }`;

// Galeri dokumentasi: foto tampil utuh sesuai bentuk aslinya (tidak dipotong), tersusun rapat seperti galeri HP.
// Ketuk foto untuk membuka layar penuh yang bisa digeser.
export function GalleryGrid({ photos, categories }: { photos: GalleryPhoto[]; categories: string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [active, setActive] = useState<number | null>(null);
  const close = useCallback(() => setActive(null), []);

  const filtered = selectedCategory === "all" ? photos : photos.filter((p) => p.category === selectedCategory);

  return (
    <div>
      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-4 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-6">
          <button type="button" onClick={() => setSelectedCategory("all")} className={chip(selectedCategory === "all")}>
            Semua ({photos.length})
          </button>
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={chip(selectedCategory === cat)}>
              {cat} ({photos.filter((p) => p.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-xs text-gray-500">Belum ada dokumentasi foto untuk kategori ini.</div>
      ) : (
        <div className="columns-2 gap-2 sm:gap-3 md:columns-3 lg:columns-4">
          {filtered.map((p, idx) => (
            <button
              key={`${p.url}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              className="group mb-2 block w-full break-inside-avoid overflow-hidden rounded-md border border-gray-200 bg-white text-left sm:mb-3"
            >
              <img src={p.url} alt={p.eventName} loading="lazy" className="block h-auto w-full transition-opacity group-hover:opacity-90" />
              <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-gray-700 sm:text-xs">{p.eventName}</span>
            </button>
          ))}
        </div>
      )}

      {active !== null && (
        <Lightbox
          photos={filtered.map((p) => ({ url: p.url, title: p.eventName, caption: p.category, href: `/event/${p.slug}` }))}
          index={active}
          onIndex={setActive}
          onClose={close}
        />
      )}
    </div>
  );
}
