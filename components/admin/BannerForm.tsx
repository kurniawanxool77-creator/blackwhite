"use client";

import { useActionState, useState } from "react";
import { createBanner, updateBanner } from "@/app/superadmin/(panel)/banners/actions";
import { useDrawer } from "./Drawer";
import { ImageUpload } from "./ImageUpload";

type EventOption = { slug: string; name: string };
export type BannerValues = { id: string; title: string; subtitle: string; imageUrl: string; linkUrl: string | null; caption: boolean };

// Dua jenis banner: iklan pelatihan (judul tampil, klik menuju pelatihan) atau gambar saja (tanpa tulisan).
// banner diisi = mode ubah.
export function BannerForm({ events, banner }: { events: EventOption[]; banner?: BannerValues }) {
  const drawer = useDrawer();
  const [saved, setSaved] = useState(0); // kunci baru = pratinjau gambar dikosongkan setelah berhasil
  const [kind, setKind] = useState<"promo" | "image">(banner && !banner.caption ? "image" : "promo");
  const linkedSlug = banner?.linkUrl?.match(/^\/event\/([^/?#]+)$/)?.[1] ?? "";
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = banner ? await updateBanner(banner.id, prev, f) : await createBanner(prev, f);
    if (!result) {
      setSaved((n) => n + 1);
      drawer?.close();
    }
    return result;
  }, null);

  return (
    <form action={action} className="mt-4 space-y-4">
      <fieldset>
        <legend className="label">Jenis banner</legend>
        <div className="grid grid-cols-2 gap-2">
          {([["promo", "Iklan pelatihan", "Judul tampil di bawah gambar"], ["image", "Gambar saja", "Tanpa tulisan tambahan"]] as const).map(([v, l, h]) => (
            <label key={v} className="flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 p-3 text-sm has-checked:border-brand has-checked:bg-green-50/60">
              <input type="radio" name="kind" value={v} checked={kind === v} onChange={() => setKind(v)} className="mt-0.5 accent-brand" />
              <span>
                <span className="block font-medium text-gray-900">{l}</span>
                <span className="block text-xs text-gray-500">{h}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="title">{kind === "promo" ? "Judul" : "Nama banner (untuk pembaca layar)"}</label>
        <input id="title" name="title" className="input" defaultValue={banner?.title} placeholder={kind === "promo" ? "contoh: Pelatihan K3 Umum, diskon 20%" : "contoh: Promo akhir tahun"} required />
      </div>
      {kind === "promo" && (
        <div>
          <label className="label" htmlFor="subtitle">Keterangan singkat (opsional)</label>
          <input id="subtitle" name="subtitle" className="input" defaultValue={banner?.subtitle} placeholder="contoh: Pendaftaran dibuka sampai 30 November" />
        </div>
      )}
      <ImageUpload key={saved} name="imageUrl" defaultValue={banner?.imageUrl} label="Gambar banner" hint="JPEG, PNG, atau WebP, maks. 4 MB. Disarankan 1680 × 640 px; teks penting di tengah." />
      {kind === "promo" ? (
        <div>
          <label className="label" htmlFor="eventSlug">Pelatihan yang diiklankan</label>
          <select id="eventSlug" name="eventSlug" className="input" defaultValue={linkedSlug}>
            <option value="">Tanpa tautan</option>
            {events.map((e) => <option key={e.slug} value={e.slug}>{e.name}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="linkUrl">Tautan saat diklik (opsional)</label>
          <input id="linkUrl" name="linkUrl" className="input" defaultValue={banner?.linkUrl ?? ""} placeholder="/event/nama-event atau https://..." />
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Menyimpan..." : banner ? "Simpan perubahan" : "Tambah banner"}
      </button>
    </form>
  );
}
