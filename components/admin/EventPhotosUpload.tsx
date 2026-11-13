"use client";

import { useRef, useState } from "react";
import { MAX_GALLERY } from "@/lib/gallery";
import { uploadImage } from "./ImageUpload";

// 1 foto sampul utama + hingga MAX_GALLERY foto tambahan di carousel/slider
const MAX_TOTAL_PHOTOS = MAX_GALLERY + 1;

type Props = {
  coverUrl?: string | null;
  gallery?: string[];
};

export function EventPhotosUpload({ coverUrl, gallery = [] }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(() => {
    const list = [...(coverUrl ? [coverUrl] : []), ...(gallery ?? [])];
    return Array.from(new Set(list.filter(Boolean))).slice(0, MAX_TOTAL_PHOTOS);
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const remaining = MAX_TOTAL_PHOTOS - photos.length;
      if (remaining <= 0) return;
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        added.push(await uploadImage(file, 1600));
      }
      setPhotos((curr) => [...curr, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function setAsCover(idx: number) {
    if (idx <= 0 || idx >= photos.length) return;
    setPhotos((curr) => {
      const target = curr[idx];
      const rest = curr.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
  }

  function remove(idx: number) {
    setPhotos((curr) => curr.filter((_, i) => i !== idx));
  }

  const primaryCover = photos[0] ?? "";
  const additionalPhotos = photos.slice(1);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="label mb-0">Foto sampul & galeri slider (maks. {MAX_TOTAL_PHOTOS} foto)</label>
        <span className="text-xs text-gray-500 tabular-nums">
          {photos.length} / {MAX_TOTAL_PHOTOS} foto
        </span>
      </div>

      {/* Input hidden untuk server FormData: foto ke-1 jadi coverUrl, sisanya jadi gallery */}
      <input type="hidden" name="coverUrl" value={primaryCover} />
      {additionalPhotos.map((u) => (
        <input key={u} type="hidden" name="gallery" value={u} />
      ))}

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">Belum ada foto sampul / slider</p>
          <p className="mt-1 max-w-md text-xs text-gray-500">
            Unggah satu atau beberapa foto sekaligus. Foto pertama otomatis menjadi sampul utama (kartu event), foto lainnya tampil di slider halaman detail kegiatan.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? "Mengunggah..." : "+ Pilih foto (bisa banyak)"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((url, idx) => {
            const isCover = idx === 0;
            return (
              <div
                key={url}
                className={`group relative aspect-video overflow-hidden rounded-md border bg-gray-100 ${
                  isCover ? "border-brand ring-2 ring-brand/30" : "border-gray-200"
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/25 opacity-0 transition group-hover:opacity-100" />

                {isCover ? (
                  <span className="absolute top-1.5 left-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                    ★ Sampul Utama
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAsCover(idx)}
                    className="absolute bottom-1.5 left-1.5 rounded bg-gray-900/80 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs hover:bg-brand"
                  >
                    Jadikan sampul
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Hapus foto"
                  onClick={() => remove(idx)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded bg-gray-900/80 text-xs text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />

      {photos.length > 0 && photos.length < MAX_TOTAL_PHOTOS && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? "Mengunggah..." : "+ Tambah foto lagi"}
        </button>
      )}

      <p className="text-xs text-gray-500">
        Rasio rekomendasi 16:9 (maks. 4 MB per foto). Foto pertama menjadi gambar sampul untuk kartu event dan thumbnail.
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

