import Link from "next/link";
import { EventStatusSelect } from "@/components/admin/EventStatusSelect";
import { PriceTag } from "@/components/ui/PriceTag";
import type { getEventDetail } from "@/lib/event-detail";
import { fmtDateRange, fmtNum } from "@/lib/format";

type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventDetail>>>["event"];

// Kartu judul halaman detail event superadmin: info singkat, status, dan tautan cepat.
export function EventDetailHeader({ event, statusAction }: { event: EventDetail; statusAction: (formData: FormData) => Promise<void> }) {
  const isCourse = event.type === "course";
  const isOnline = event.mode === "online";
  const isHybrid = event.mode === "hybrid";

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/superadmin/events" className="text-xs font-medium text-gray-500 hover:text-brand">
            ← Kembali ke Semua Event
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
            <span className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {event.category || "Umum"}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                isOnline
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : isHybrid
                  ? "border-purple-200 bg-purple-50 text-purple-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {isOnline ? "ONLINE (VIRTUAL)" : isHybrid ? "HYBRID" : "TATAP MUKA (OFFLINE)"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {event.location} · {fmtDateRange(event.startDate, event.endDate)}
            {event.quota ? ` · Kuota ${fmtNum(event.quota)} peserta` : ""}
          </p>
          <PriceTag event={event} className="mt-1.5 text-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EventStatusSelect status={event.status} action={statusAction} />

          {!isCourse && !isOnline && (
            <Link
              href={`/superadmin/absensi?eventId=${event.id}`}
              className="btn btn-secondary btn-sm"
              title="Lihat rekapitulasi absensi tim lapangan"
            >
              Absensi Tim
            </Link>
          )}

          {event.status !== "draft" && (
            <Link href={`/event/${event.slug}`} target="_blank" className="btn btn-secondary btn-sm">
              Halaman Publik ↗
            </Link>
          )}

          <Link href={`/superadmin/keuangan?event=${event.id}`} className="btn btn-secondary btn-sm">
            Keuangan
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
          {isCourse ? "Pelatihan Video (LMS)" : "Event Terjadwal"}
        </span>
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
          {event.autoApprove ? "Persetujuan Otomatis" : "Ditinjau Admin"}
        </span>
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
          {event.useQr ? "Tiket QR Aktif" : "Tanpa Tiket QR"}
        </span>
        {event.registrationEnd && (
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
            Batas Daftar: {fmtDateRange(event.registrationEnd, event.registrationEnd)}
          </span>
        )}
        {event.codePrefix && (
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-gray-700">
            Kode: {event.codePrefix}-001…
          </span>
        )}
      </div>
    </div>
  );
}
