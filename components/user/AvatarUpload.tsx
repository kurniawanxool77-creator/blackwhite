"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { shrink } from "@/components/admin/ImageUpload";

// Foto profil peserta: klik untuk memilih/memotret, langsung diunggah dan dipakai di seluruh aplikasi.
export function AvatarUpload({
  name,
  image,
  hint = "Tampil di hasil scan agar panitia bisa mencocokkan wajah Anda. Gunakan foto wajah yang jelas.",
}: { name: string; image: string | null; hint?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(image);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", await shrink(file, 800), "foto.webp");
      const res = await fetch("/api/upload/avatar", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal mengunggah foto.");
      setUrl(json.url);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Ganti foto profil"
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand text-2xl font-bold text-white">
            {name.charAt(0).toUpperCase() || "P"}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-0.5 text-[10px] font-medium text-white">
          {busy ? "..." : "Ubah"}
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">Foto profil</p>
        <p className="text-xs text-gray-600">{hint}</p>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn btn-secondary btn-sm mt-2">
          {busy ? "Mengunggah..." : url ? "Ganti foto" : "Unggah foto"}
        </button>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
