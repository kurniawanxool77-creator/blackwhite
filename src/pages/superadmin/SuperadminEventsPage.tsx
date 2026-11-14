import type { Event } from "@prisma/client";
import { Link, useSearchParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryFilter, categoryFilterItems } from "@/components/ui/CategoryFilter";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isRunning } from "@/lib/checkin";
import { EVENT_STATUS, fmtDate, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { createEvent, deleteEvent } from "@/src/lib/actions/events";
import { useApiData } from "@/src/lib/api-client";

type EventRow = Event & { _count: { checkpoints: number } };

type EventsPayload = {
  events: EventRow[];
  counts: { eventId: string; status: string; count: number }[];
  categories: string[];
};

const deleteMessage = (name: string, registrations: number) =>
  registrations
    ? `Hapus "${name}"? ${registrations} pendaftaran beserta riwayat scan, nilai kuis, dan sertifikatnya ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`
    : `Hapus "${name}" beserta rundown-nya? Tindakan ini tidak bisa dibatalkan.`;

export function SuperadminEventsPage() {
  const [searchParams] = useSearchParams();
  const kategori = searchParams.get("kategori") || undefined;
  const apiUrl = kategori ? `/api/superadmin/events?kategori=${encodeURIComponent(kategori)}` : "/api/superadmin/events";
  const state = useApiData<EventsPayload>(apiUrl);

  return (
    <DataGate state={state}>
      {({ events, counts, categories }) => {
        const countMap = new Map<string, number>();
        for (const c of counts) countMap.set(`${c.eventId}:${c.status}`, c.count);
        const count = (eventId: string, status: string) => countMap.get(`${eventId}:${status}`) ?? 0;
        const catItems = categoryFilterItems(categories, kategori, (c) =>
          c ? `/superadmin/events?kategori=${encodeURIComponent(c)}` : "/superadmin/events",
        );

        return (
          <div className="space-y-4">
            <PageHeader title="Event & Acara" description="Klik nama event untuk mengubah info, formulir, rundown, tim, materi, dan sertifikat.">
              <Drawer label="+ Buat event" title="Buat event baru" size="lg">
                <EventForm action={createEvent} categories={categories} />
              </Drawer>
            </PageHeader>

            <section>
              <CategoryFilter items={catItems} />

              <div className="card mt-4 overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Event & Acara</th>
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
                      <tr><td colSpan={7} className="py-6 text-center text-gray-500">Belum ada event.</td></tr>
                    )}
                    {events.map((e) => {
                      const running = isRunning(e);
                      const pendingCount = count(e.id, "pending");
                      const approvedCount = count(e.id, "approved");
                      const totalReg = pendingCount + approvedCount + count(e.id, "rejected");
                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link to={`/superadmin/events/${e.id}`} className="font-semibold text-brand hover:underline">
                                {e.name}
                              </Link>
                              {running && (
                                <span className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                                  Sedang berlangsung
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {[e.type === "course" ? "Pelatihan video" : "Tatap muka", e.category, e.location].filter(Boolean).join(" · ")}
                              {e._count.checkpoints > 0 ? ` · ${e._count.checkpoints} pos checkpoint` : ""}
                            </p>
                          </td>
                          <td className="whitespace-nowrap font-mono text-xs">{fmtDate(e.startDate)}</td>
                          <td className="whitespace-nowrap"><PriceTag event={e} className="text-sm" /></td>
                          <td><StatusBadge status={e.status} label={EVENT_STATUS[e.status] ?? e.status} /></td>
                          <td className="text-right">
                            {pendingCount > 0 ? (
                              <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                                {fmtNum(pendingCount)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <span className="font-semibold text-gray-900">{fmtNum(approvedCount)}</span>
                            {e.quota ? <span className="text-xs text-gray-500"> / {fmtNum(e.quota)}</span> : null}
                          </td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              <Link to={`/superadmin/absensi?eventId=${e.id}`} className="btn btn-secondary btn-sm" title="Lihat absensi tim untuk event ini">
                                Absensi
                              </Link>
                              <Link to={`/superadmin/events/${e.id}`} className="btn btn-primary btn-sm">
                                Kelola
                              </Link>
                              <form action={async () => { await deleteEvent(e.id); }}>
                                <ConfirmSubmit message={deleteMessage(e.name, totalReg)} className="btn btn-danger btn-sm">
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
      }}
    </DataGate>
  );
}

