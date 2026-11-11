"use client";

import { useEffect, useRef, useState } from "react";

const YT_ORIGIN = "https://www.youtube-nocookie.com";

// Thumbnail dulu; video YouTube (mode privasi) baru dimuat saat diklik agar halaman tetap ringan.
// onStarted/onEnded memakai pesan bawaan pemutar YouTube (enablejsapi) untuk mendeteksi video diputar/selesai.
export function VideoPlayer({ id, title, onStarted, onEnded }: { id: string; title: string; onStarted?: () => void; onEnded?: () => void }) {
  const [play, setPlay] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const handlers = useRef({ onStarted, onEnded });
  useEffect(() => {
    handlers.current = { onStarted, onEnded };
  });

  useEffect(() => {
    if (!play) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; info?: number | { playerState?: number } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const state = data.event === "onStateChange" ? data.info : typeof data.info === "object" ? data.info?.playerState : undefined;
      if (state === 1) handlers.current.onStarted?.(); // sedang diputar
      if (state === 0) handlers.current.onEnded?.(); // selesai
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [play]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
      {play ? (
        <iframe
          ref={frame}
          src={`${YT_ORIGIN}/embed/${id}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // Minta pemutar mengirim perubahan status (diputar / selesai) ke halaman ini.
          onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN)}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Putar video: ${title}`} className="group absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
          <span className="absolute top-1/2 left-1/2 flex h-12 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-red-600 text-white shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
