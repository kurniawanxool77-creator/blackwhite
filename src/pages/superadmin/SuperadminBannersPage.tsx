import type { Banner } from "@prisma/client";
import { BannerForm } from "@/components/admin/BannerForm";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { DataGate } from "@/src/components/RouteState";
import { deleteBanner, moveBanner, toggleBanner } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";

type BannerPayload = {
  banners: Banner[];
  events: { slug: string; name: string }[];
};

export function SuperadminBannersPage() {
  const state = useApiData<BannerPayload>("/api/superadmin/banners");

  return (
    <DataGate state={state}>
      {({ banners, events }) => (
        <div className="space-y-6">
          <PageHeader title="Banner promosi" description="Kelola slider banner yang tampil di halaman beranda.">
            <Drawer label="+ Tambah banner" title="Tambah banner baru">
              <BannerForm events={events} />
            </Drawer>
          </PageHeader>

          {banners.length === 0 ? (
            <div className="card p-6 text-sm text-gray-600">Belum ada banner.</div>
          ) : (
            <ul className="space-y-3">
              {banners.map((b, i) => (
                <li key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <img src={b.imageUrl} alt={b.title} className="h-20 w-36 shrink-0 rounded border border-gray-200 object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${b.active ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {b.active ? "Aktif" : "Disembunyikan"}
                      </span>
                      <span className="text-xs text-gray-400">{b.caption ? "Dengan teks" : "Gambar saja"}</span>
                    </div>
                    <p className="mt-1 truncate font-semibold text-gray-900">{b.title || "(Tanpa judul)"}</p>
                    {b.subtitle && <p className="truncate text-xs text-gray-500">{b.subtitle}</p>}
                    {b.linkUrl && <p className="truncate text-xs text-brand">{b.linkUrl}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => moveBanner(b.id, "up")} disabled={i === 0} className="btn btn-secondary btn-sm">↑</button>
                    <button type="button" onClick={() => moveBanner(b.id, "down")} disabled={i === banners.length - 1} className="btn btn-secondary btn-sm">↓</button>
                    <button type="button" onClick={() => toggleBanner(b.id)} className="btn btn-secondary btn-sm">
                      {b.active ? "Sembunyikan" : "Aktifkan"}
                    </button>
                    <Drawer label="Ubah" title="Ubah banner" variant="secondary">
                      <BannerForm events={events} banner={b} />
                    </Drawer>
                    <form action={async () => { await deleteBanner(b.id); }}>
                      <ConfirmSubmit message="Hapus banner ini?" className="btn btn-danger btn-sm">Hapus</ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DataGate>
  );
}

