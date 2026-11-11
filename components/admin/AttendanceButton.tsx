"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { shrink } from "@/components/admin/ImageUpload";

type Props = { eventId: string; type: "in" | "out"; className?: string };

// Absen dengan foto selfie: tombol membuka kamera depan (di HP), foto dikecilkan lalu dikirim ke server.
export function AttendanceButton({ eventId, type, className }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = type === "in" ? "Absen datang" : "Absen selesai acara";

  async function send(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("eventId", eventId);
      body.append("type", type);
      body.append("file", await shrink(file, 720), "selfie.webp");
      const res = await fetch("/api/attendance", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Absensi gagal dikirim.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Absensi gagal dikirim.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={className ?? `btn ${type === "in" ? "btn-success" : "btn-secondary"}`}
      >
        {busy ? "Mengirim..." : `${label} (foto)`}
      </button>
      {/* capture="user": di HP langsung membuka kamera depan untuk selfie */}
      <input ref={input} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
      {error && <p className="max-w-64 text-right text-xs text-red-700">{error}</p>}
    </div>
  );
}
