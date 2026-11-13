"use client";

import { useRef, useState } from "react";

type Props = { name: string; label: string; hint?: string; defaultValue?: string | null; maxWidth?: number };

// Perkecil di browser (maks. maxWidth px, WebP) sehingga unggahan cepat dan hemat penyimpanan.
export async function shrink(file: File, maxWidth: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

// Unggah satu gambar ke server (yang mengubahnya ke WebP) dan kembalikan URL-nya. Melempar Error berpesan Indonesia.
export async function uploadImage(file: File, maxWidth: number): Promise<string> {
  const body = new FormData();
  body.append("file", await shrink(file, maxWidth), "gambar.webp");
  const res = await fetch("/api/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Gagal mengunggah gambar.");
  return json.url;
}

export function ImageUpload({ name, label, hint, defaultValue, maxWidth = 1680 }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevDefault, setPrevDefault] = useState(defaultValue);
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setUrl(defaultValue ?? "");
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setUrl(await uploadImage(file, maxWidth));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        <div className="flex aspect-video w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 text-xs text-gray-500">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            "Belum ada gambar"
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "Mengunggah..." : url ? "Ganti gambar" : "Pilih gambar"}
          </button>
          {url && !busy && (
            <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => setUrl("")}>
              Hapus gambar
            </button>
          )}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
