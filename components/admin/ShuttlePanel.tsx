import Link from "next/link";
import { addShuttle, deleteShuttle, updateShuttle } from "@/app/superadmin/(panel)/events/shuttle-actions";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { REG_STATUS } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { fmtDepart, wibDateInput, wibTimeInput } from "@/lib/schedule";
import type { shuttleManifest } from "@/lib/shuttle";
import { Drawer } from "./Drawer";
import { DrawerForm } from "./DrawerForm";

type Route = Awaited<ReturnType<typeof shuttleManifest>>[number];

function RouteFields({ r, defaultDate }: { r?: Route; defaultDate: string }) {
  return (
    <>
      <div>
        <label className="label" htmlFor="sh-origin">Dari (titik jemput)</label>
        <input id="sh-origin" name="origin" className="input" defaultValue={r?.origin} placeholder="mis. Bandara Ahmad Yani, pintu kedatangan" required maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="sh-dest">Ke (tujuan)</label>
        <input id="sh-dest" name="destination" className="input" defaultValue={r?.destination} placeholder="mis. Hotel Patra Semarang" required maxLength={120} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="sh-date">Tanggal berangkat</label>
          <input id="sh-date" name="departDate" type="date" className="input" defaultValue={r ? wibDateInput(r.departAt) : defaultDate} required />
        </div>
        <div>
          <label className="label" htmlFor="sh-time">Jam berangkat (WIB)</label>
          <input id="sh-time" name="departTime" type="time" className="input" defaultValue={r ? wibTimeInput(r.departAt) : "10:00"} required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="sh-cap">Kapasitas kursi (kosongkan jika tanpa batas)</label>
        <input id="sh-cap" name="capacity" className="input" inputMode="numeric" defaultValue={r?.capacity ?? ""} placeholder="mis. 20" />
      </div>
      <div>
        <label className="label" htmlFor="sh-note">Catatan</label>
        <input id="sh-note" name="note" className="input" defaultValue={r?.note} placeholder="mis. Bus 30 kursi, termasuk angkut sepeda, kontak sopir 0812..." maxLength={300} />
      </div>
    </>
  );
}

// Rute shuttle event (dari → ke, jadwal, kapasitas) + daftar penumpang per rute. readOnly = tampilan panitia.
export function ShuttlePanel({ eventId, routes, defaultDate, detailBase, readOnly }: { eventId: string; routes: Route[]; defaultDate: string; detailBase: string; readOnly?: boolean }) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-gray-900">Shuttle</h2>
          <p className="text-xs text-gray-500">Peserta memilih rute di formulir pendaftaran (isian tipe &quot;Shuttle&quot;). Kursi tidak bisa dipilih melebihi kapasitas.</p>
        </div>
        {!readOnly && (
          <Drawer label="+ Tambah rute" title="Tambah rute shuttle" variant="secondary">
            <DrawerForm action={addShuttle.bind(null, eventId)} submitLabel="Tambah rute">
              <RouteFields defaultDate={defaultDate} />
            </DrawerForm>
          </Drawer>
        )}
      </div>
      {routes.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-500">Belum ada rute shuttle.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {routes.map((r) => {
            const taken = r.registrations.length;
            const full = r.capacity != null && taken >= r.capacity;
            return (
              <li key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{r.origin} <span className="text-gray-400">→</span> {r.destination}</p>
                    <p className="text-sm text-brand">{fmtDepart(r.departAt)}</p>
                    {r.note && <p className="text-xs text-gray-600">{r.note}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${full ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                      {taken}{r.capacity != null ? `/${r.capacity}` : ""} kursi{full ? " · penuh" : ""}
                    </span>
                    {!readOnly && (
                      <>
                        <Drawer label="Ubah" title="Ubah rute shuttle" variant="secondary">
                          <DrawerForm action={updateShuttle.bind(null, r.id)}>
                            <RouteFields r={r} defaultDate={defaultDate} />
                          </DrawerForm>
                        </Drawer>
                        <form action={deleteShuttle.bind(null, r.id)}>
                          <ConfirmSubmit message={`Hapus rute ${r.origin} → ${r.destination}?${taken ? ` ${taken} penumpang menjadi tanpa shuttle.` : ""}`} className="btn btn-danger btn-sm">Hapus</ConfirmSubmit>
                        </form>
                      </>
                    )}
                  </div>
                </div>
                {taken > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-brand">Daftar penumpang ({taken})</summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="table text-sm">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Nama</th>
                            <th>WhatsApp</th>
                            <th>Detail kedatangan</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.registrations.map((p, i) => (
                            <tr key={p.id}>
                              <td className="text-gray-500">{i + 1}</td>
                              <td>
                                <Link href={`${detailBase}/${p.id}`} className="font-medium text-brand hover:underline">{p.user.name}</Link>
                                {p.code && <span className="ml-1.5 font-mono text-xs text-gray-700">{p.code}</span>}
                              </td>
                              <td className="whitespace-nowrap">{p.user.phone ?? "-"}</td>
                              <td className="text-gray-700">{readDetails(p.details).answers.find((a) => /kedatangan|jadwal tiba/i.test(a.label))?.value ?? "-"}</td>
                              <td><StatusBadge status={p.status} label={REG_STATUS[p.status]} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
