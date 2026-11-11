import type { Event } from "@prisma/client";
import { Link, useSearchParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryFilter, categoryFilterItems } from "@/components/ui/CategoryFilter";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EVENT_MODE, EVENT_STATUS, fmtDate, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { createEvent, deleteEvent } from "@/src/lib/actions/events";
import { useApiData } from "@/src/lib/api-client";

type EventRow = Event & { _count: { checkpoints: number } };

type EventsPayload = {
  events: EventRow[];
  counts: { eventId: string; status: string; count: number }[];
  categories: string[];
};

const deleteMessage = (name: string, totalReg: number) =>
  totalReg > 0
    ? `Hapus event "${name}"? ${totalReg} pendaftaran peserta ikut terhapus permanen.`
    : `Hapus event "${name}"?`;

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
          <div className="space-y-5">
            <PageHeader title="Event & pelatihan" description="Kelola pelatihan, formulir pendaftaran, rundown QR, materi, dan sertifikat.">
              <Drawer label="+ Buat event" title="Buat event baru">
                <EventForm action={createEvent} categories={categories} />
              </Drawer>
            </PageHeader>

            <CategoryFilter items={catItems} />

            <section className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Event & pelatihan</th>
                      <th>Tanggal</th>
                      <th>Harga</th>
                      <th>Status</th>
                      <th className="text-right">Menunggu</th>
                      <th className="text-right">Disetujui</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500">Belum ada event.</td></tr>
                    )}
                    {events.map((e) => {
                      const pendingCount = count(e.id, "pending");
                      const approvedCount = count(e.id, "approved");
                      const totalReg = pendingCount + approvedCount + count(e.id, "rejected");
                      return (
                        <tr key={e.id}>
                          <td>
                            <Link to={`/superadmin/events/${e.id}`} className="font-semibold text-gray-900 hover:text-brand">
                              {e.name}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {[e.category || "Umum", EVENT_MODE[e.mode] ?? e.mode, e.location, `${fmtNum(e._count.checkpoints)} pos`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </td>
                          <td className="whitespace-nowrap text-xs text-gray-600">{fmtDate(e.startDate)}</td>
                          <td className="whitespace-nowrap"><PriceTag event={e} /></td>
                          <td><StatusBadge status={e.status} label={EVENT_STATUS[e.status] ?? e.status} /></td>
                          <td className="text-right tabular-nums">
                            {pendingCount > 0 ? (
                              <Link to={`/superadmin/events/${e.id}?status=pending`} className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                {fmtNum(pendingCount)}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                          <td className="text-right whitespace-nowrap tabular-nums">
                            <span className="font-semibold text-gray-900">{fmtNum(approvedCount)}</span>
                            {e.quota ? <span className="text-xs text-gray-500"> / {fmtNum(e.quota)}</span> : null}
                          </td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              <Link to={`/superadmin/absensi?eventId=${e.id}`} className="btn btn-secondary btn-sm">Absensi</Link>
                              <Link to={`/superadmin/events/${e.id}`} className="btn btn-primary btn-sm">Kelola</Link>
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

