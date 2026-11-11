"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRightIcon, CloseIcon } from "./icons";

export type LightboxPhoto = { url: string; title: string; caption?: string; href?: string };

const navButton =
  "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-2xl text-gray-900 shadow hover:bg-white";

// Penampil foto layar penuh: foto utuh (tidak dipotong), geser jari, panah ‹ ›, tombol ← → / Esc, thumbnail.
export function Lightbox({ photos, index, onIndex, onClose }: { photos: LightboxPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const touchX = useRef<number | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const photo = photos[index];
  const go = (step: number) => onIndex((index + step + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden"; // halaman di belakang tidak ikut tergulir
    thumbs.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, photos.length, onIndex, onClose]);

  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Galeri foto">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{photo.title}</p>
          <p className="text-xs text-gray-400">
            {index + 1} / {photos.length}
            {photo.caption && ` · ${photo.caption}`}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Tutup galeri" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-200 hover:bg-white/10">
          <CloseIcon width={22} height={22} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {photos.length > 1 && <button type="button" onClick={() => go(-1)} aria-label="Foto sebelumnya" className={`${navButton} left-3 hidden sm:flex`}>‹</button>}
        {/* key memicu animasi setiap foto berganti */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photo.url + index} src={photo.url} alt={photo.title} className="animate-rise h-full w-full object-contain select-none" draggable={false} />
        {photos.length > 1 && <button type="button" onClick={() => go(1)} aria-label="Foto berikutnya" className={`${navButton} right-3 hidden sm:flex`}>›</button>}
      </div>

      {photos.length > 1 && (
        <div ref={thumbs} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((p, i) => (
            <button
              key={`${p.url}-t${i}`}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded border-2 ${i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs">
        <span className="text-gray-400">{photos.length > 1 ? "Geser untuk foto lain" : ""}</span>
        {photo.href && (
          <Link href={photo.href} className="inline-flex items-center gap-1.5 font-medium text-green-300 hover:underline">
            Halaman acara <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
