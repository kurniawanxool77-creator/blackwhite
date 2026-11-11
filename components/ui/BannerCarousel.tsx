"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Banner = { id: string; title: string; subtitle: string; imageUrl: string; linkUrl: string | null; caption: boolean };

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;

// caption = false: "gambar saja" (gambar sudah berisi desainnya sendiri), tanpa tulisan tambahan.
function Slide({ banner }: { banner: Banner }) {
  const body = (
    <>
      <img src={banner.imageUrl} alt={banner.title} draggable={false} className="aspect-[16/9] w-full object-cover select-none sm:aspect-[21/8]" />
      {banner.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gray-900/70 px-4 py-3 text-white sm:px-6 sm:py-4">
          <p className="text-sm font-semibold sm:text-lg">{banner.title}</p>
          {banner.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-white/85 sm:text-sm">{banner.subtitle}</p>}
        </div>
      )}
    </>
  );
  const cls = "relative block w-full shrink-0 overflow-hidden";
  if (!banner.linkUrl) return <div className={cls}>{body}</div>;
  return banner.linkUrl.startsWith("/") ? (
    <Link href={banner.linkUrl} className={cls} draggable={false}>{body}</Link>
  ) : (
    <a href={banner.linkUrl} className={cls} target="_blank" rel="noopener noreferrer" draggable={false}>{body}</a>
  );
}

// Slider promosi tanpa ujung: setelah banner terakhir kembali ke pertama (dan sebaliknya) tanpa memutar balik.
// Salinan banner terakhir/pertama dipasang di kedua ujung; setelah animasi selesai posisi dilompatkan diam-diam.
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const n = banners.length;
  const [pos, setPos] = useState(1); // 1..n = banner asli; 0 dan n+1 = salinan
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const go = (step: number) => {
    setAnimate(true);
    setPos((p) => Math.min(n + 1, Math.max(0, p + step)));
  };

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => go(1), INTERVAL_MS);
    return () => clearInterval(timer);
    // go stabil (hanya setState); n mengikuti jumlah banner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, paused]);

  if (n === 0) return null;
  if (n === 1) {
    return (
      <div className="overflow-hidden rounded-md border border-gray-200">
        <Slide banner={banners[0]} />
      </div>
    );
  }

  const slides = [banners[n - 1], ...banners, banners[0]];
  const active = (pos - 1 + n) % n;

  return (
    <div
      className="group relative overflow-hidden rounded-md border border-gray-200 touch-pan-y"
      role="region"
      aria-roledescription="carousel"
      aria-label="Promosi"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        startX.current = e.touches[0].clientX;
        moved.current = false;
      }}
      onTouchMove={(e) => {
        if (startX.current === null) return;
        const dx = e.touches[0].clientX - startX.current;
        if (Math.abs(dx) > 5) moved.current = true;
        setAnimate(false);
        setDrag(dx);
      }}
      onTouchEnd={() => {
        if (Math.abs(drag) > SWIPE_PX) go(drag < 0 ? 1 : -1);
        else setAnimate(true);
        setDrag(0);
        startX.current = null;
        setPaused(false);
      }}
      onClickCapture={(e) => {
        if (moved.current) e.preventDefault(); // geseran jari bukan klik tautan banner
        moved.current = false;
      }}
    >
      <div
        className={`flex ${animate ? "transition-transform duration-500 ease-out" : ""}`}
        style={{ transform: `translateX(calc(${-pos * 100}% + ${drag}px))` }}
        onTransitionEnd={() => {
          if (pos === 0 || pos === n + 1) {
            setAnimate(false);
            setPos(pos === 0 ? n : 1);
          }
        }}
      >
        {slides.map((b, i) => (
          <div key={`${b.id}-${i}`} className="w-full shrink-0" aria-hidden={i !== pos}>
            <Slide banner={b} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Banner sebelumnya"
        onClick={() => go(-1)}
        className="absolute top-1/2 left-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-gray-800 shadow-sm hover:bg-white sm:group-hover:flex"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Banner berikutnya"
        onClick={() => go(1)}
        className="absolute top-1/2 right-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-gray-800 shadow-sm hover:bg-white sm:group-hover:flex"
      >
        ›
      </button>
      <div className="absolute top-3 right-3 flex gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Banner ${i + 1}`}
            aria-current={i === active}
            onClick={() => {
              setAnimate(true);
              setPos(i + 1);
            }}
            className={`h-2 rounded-full shadow-sm transition-all duration-300 ${i === active ? "w-5 bg-white" : "w-2 bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
