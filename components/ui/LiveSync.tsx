"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_MS = 4000;
export const LIVE_EVENT = "live-change";

// Pasang sekali di root layout. Bila ada perubahan data dari siapa pun, halaman yang sedang dibuka dimuat ulang
// datanya (router.refresh menjaga isian form dan posisi scroll). Tab yang tersembunyi tidak bertanya ke server.
export function LiveSync() {
  const router = useRouter();

  useEffect(() => {
    let last: string | undefined;
    let busy = false;

    const check = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        const { v } = (await res.json()) as { v: string };
        if (last !== undefined && v !== last) {
          router.refresh();
          window.dispatchEvent(new Event(LIVE_EVENT));
        }
        last = v;
      } catch {
        // jaringan putus: coba lagi di putaran berikutnya
      } finally {
        busy = false;
      }
    };

    check();
    const id = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
}
