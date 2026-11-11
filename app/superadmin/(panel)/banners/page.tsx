import { BannerForm } from "@/components/admin/BannerForm";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteBanner, moveBanner, toggleBanner } from "./actions";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  await requireAdmin("superadmin");
  const [banners, events] = await Promise.all([
    db.banner.findMany({ orderBy: { order: "asc" } }),
    db.event.findMany({ where: { status: { in: ["open", "closed"] } }, orderBy: { startDate: "asc" }, select: { slug: true, name: true } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Banner beranda" description="Slide di bagian atas beranda: iklan pelatihan atau gambar saja. Urutan dari atas ke bawah = urutan tampil; berganti otomatis tiap 5 detik.">
        <Drawer label="+ Tambah banner" title="Tambah banner">
          <BannerForm events={events} />
        </Drawer>
      </PageHeader>
      <section>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Banner</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500">Belum ada banner. Beranda tampil tanpa slider.</td>
                </tr>
              )}
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.imageUrl} alt="" className="h-12 w-24 shrink-0 rounded border border-gray-200 object-cover" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {b.title}
                          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">{b.caption ? "Iklan pelatihan" : "Gambar saja"}</span>
                        </p>
                        {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
                        {b.linkUrl && <p className="text-xs text-brand">{b.linkUrl}</p>}
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={b.active ? "open" : "draft"} label={b.active ? "Tampil" : "Disembunyikan"} /></td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Drawer label="Ubah" title="Ubah banner" variant="secondary">
                        <BannerForm events={events} banner={{ id: b.id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl, caption: b.caption }} />
                      </Drawer>
                      <form action={moveBanner.bind(null, b.id, "up")}><button className="btn btn-secondary btn-sm" aria-label="Naikkan">↑</button></form>
                      <form action={moveBanner.bind(null, b.id, "down")}><button className="btn btn-secondary btn-sm" aria-label="Turunkan">↓</button></form>
                      <form action={toggleBanner.bind(null, b.id)}>
                        <button className="btn btn-secondary btn-sm">{b.active ? "Sembunyikan" : "Tampilkan"}</button>
                      </form>
                      <form action={deleteBanner.bind(null, b.id)}><ConfirmSubmit message={`Hapus banner "${b.title}"?`} className="btn btn-danger btn-sm">Hapus</ConfirmSubmit></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
