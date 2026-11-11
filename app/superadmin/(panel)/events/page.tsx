import Link from "next/link";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { isRunning } from "@/lib/checkin";
import { db } from "@/lib/db";
import { getCategories } from "@/lib/event-detail";
import { queryParam } from "@/lib/event-search";
import { EVENT_STATUS, fmtDate, fmtNum } from "@/lib/format";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { createEvent, deleteEvent } from "./actions";

// Pesan konfirmasi hapus: sebutkan data yang ikut terhapus bila event sudah punya pendaftar.
const deleteMessage = (name: string, registrations: number) =>
  registrations
    ? `Hapus "${name}"? ${registrations} pendaftaran beserta riwayat scan, nilai kuis, dan sertifikatnya ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`
    : `Hapus "${name}" beserta rundown-nya? Tindakan ini tidak bisa dibatalkan.`;
import { EventForm } from "@/components/admin/EventForm";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function EventsPage({ searchParams }: PageProps<"/superadmin/events">) {
  await requireAdmin("superadmin");
  const kategori = queryParam((await searchParams).kategori);
  const [events, counts, categories] = await Promise.all([
    db.event.findMany({
      where: kategori ? { category: kategori } : {},
      include: { _count: { select: { checkpoints: true } } },
      orderBy: { startDate: "desc" },
    }),
    db.registration.groupBy({ by: ["eventId", "status"], _count: true }),
    getCategories(),
  ]);
  const count = (eventId: string, status: string) =>
    counts.find((c) => c.eventId === eventId && c.status === status)?._count ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Event & pelatihan" description="Klik nama event untuk mengubah info, formulir, rundown, tim, materi, dan sertifikat.">
        <Drawer label="+ Buat event" title="Buat event / pelatihan baru" size="lg">
          <EventForm action={createEvent} categories={categories} />
        </Drawer>
      </PageHeader>
      <section>
        {categories.length > 0 && (
          <nav aria-label="Filter kategori" className="no-scrollbar flex gap-1.5 overflow-x-auto text-sm">
            {["", ...categories].map((c) => (
              <Link
                key={c || "semua"}
                href={c ? `/superadmin/events?kategori=${encodeURIComponent(c)}` : "/superadmin/events"}
                className={`shrink-0 rounded px-3 py-1.5 whitespace-nowrap ${(kategori ?? "") === c ? "bg-brand text-white font-semibold" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {c || "Semua"}
              </Link>
            ))}
          </nav>
        )}
        <div className="card mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Event & Pelatihan</th>
                <th>Tanggal</th>
                <th>Harga</th>
                <th>Status</th>
                <th className="text-right">Menunggu</th>
                <th className="text-right">Disetujui</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-6">Belum ada event.</td>
                </tr>
              )}
              {events.map((e) => {
                const running = isRunning(e);
                const pendingCount = count(e.id, "pending");
                const approvedCount = count(e.id, "approved");
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/superadmin/events/${e.id}`} className="font-semibold text-brand hover:underline">
                          {e.name}
                        </Link>
                        {running && (
                          <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.2 text-[10px] font-semibold text-green-700">
                            Sedang berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[e.type === "course" ? "Pelatihan video" : "Tatap muka", e.category, e.location].filter(Boolean).join(" · ")}
                        {e._count.checkpoints > 0 ? ` · ${e._count.checkpoints} pos checkpoint` : ""}
                      </p>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs">{fmtDate(e.startDate)}</td>
                    <td className="whitespace-nowrap"><PriceTag event={e} className="text-sm" /></td>
                    <td><StatusBadge status={e.status} label={EVENT_STATUS[e.status]} /></td>
                    <td className="text-right">
                      {pendingCount > 0 ? (
                        <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                          {fmtNum(pendingCount)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{fmtNum(approvedCount)}</span>
                      {e.quota ? <span className="text-gray-500 text-xs"> / {fmtNum(e.quota)}</span> : null}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/superadmin/absensi?eventId=${e.id}`} className="btn btn-secondary btn-sm" title="Lihat absensi tim untuk event ini">
                          Absensi
                        </Link>
                        <Link href={`/superadmin/events/${e.id}`} className="btn btn-primary btn-sm">
                          Kelola
                        </Link>
                        <form action={deleteEvent.bind(null, e.id)}>
                          <ConfirmSubmit message={deleteMessage(e.name, pendingCount + approvedCount + count(e.id, "rejected"))} className="btn btn-danger btn-sm">
                            Hapus
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
