"use client";

import { useRef, useState } from "react";
import { MAX_GALLERY } from "@/lib/gallery";
import { uploadImage } from "./ImageUpload";

// Beberapa foto sekaligus (maks. MAX_GALLERY). Setiap foto dikirim sebagai field "gallery".
export function GalleryUpload({ defaultValue = [] }: { defaultValue?: string[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, MAX_GALLERY - urls.length)) added.push(await uploadImage(file, 1400));
      setUrls((current) => [...current, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">Galeri foto (maks. {MAX_GALLERY})</span>
      {urls.map((u) => <input key={u} type="hidden" name="gallery" value={u} />)}
      <div className="grid grid-cols-4 gap-2">
        {urls.map((u) => (
          <div key={u} className="group relative aspect-video overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Hapus foto"
              onClick={() => setUrls((current) => current.filter((x) => x !== u))}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded bg-gray-900/75 text-sm text-white hover:bg-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files)} />
      {urls.length < MAX_GALLERY && (
        <button type="button" className="btn btn-secondary btn-sm mt-2" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Mengunggah..." : "Tambah foto"}
        </button>
      )}
      <p className="mt-1 text-xs text-gray-500">Foto yang tampil di halaman detail event, setelah foto sampul.</p>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
