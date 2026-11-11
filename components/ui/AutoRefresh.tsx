"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Muat ulang data server secara berkala (pengganti real time untuk MVP).
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
