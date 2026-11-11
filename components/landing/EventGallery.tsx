"use client";

import { useCallback, useRef, useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";

const arrow =
  "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-lg leading-none text-gray-800 shadow-sm hover:bg-white sm:opacity-0 sm:group-hover:opacity-100";

// Foto utama (utuh, tidak dipotong) + thumbnail. Geser jari / panah untuk ganti foto, ketuk untuk layar penuh.
export function EventGallery({ photos, title }: { photos: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [full, setFull] = useState(false);
  const touchX = useRef<number | null>(null);
  const close = useCallback(() => setFull(false), []);
  if (photos.length === 0) return null;
  const go = (i: number) => setActive((i + photos.length) % photos.length);

  return (
    <div className="mb-5 min-w-0">
      <div
        className="group relative overflow-hidden rounded-md border border-gray-200 bg-gray-100"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {/* key memicu animasi muncul setiap foto berganti */}
        <button type="button" onClick={() => setFull(true)} aria-label="Lihat foto layar penuh" className="block w-full cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={active} src={photos[active]} alt={`${title}, foto ${active + 1}`} draggable={false} className="animate-rise block aspect-video w-full object-contain select-none" />
        </button>
        {photos.length > 1 && (
          <>
            <button type="button" aria-label="Foto sebelumnya" onClick={() => go(active - 1)} className={`${arrow} left-2`}>‹</button>
            <button type="button" aria-label="Foto berikutnya" onClick={() => go(active + 1)} className={`${arrow} right-2`}>›</button>
            <span className="absolute right-2 bottom-2 rounded bg-gray-900/70 px-2 py-0.5 text-xs text-white tabular-nums">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {full && <Lightbox photos={photos.map((url) => ({ url, title }))} index={active} onIndex={setActive} onClose={close} />}
      {photos.length > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              aria-label={`Lihat foto ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`aspect-video w-20 shrink-0 overflow-hidden rounded border-2 transition md:w-24 ${i === active ? "border-brand" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
