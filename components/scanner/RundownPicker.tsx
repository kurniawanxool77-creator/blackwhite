import Link from "next/link";
import { QrCodeIcon } from "@/components/ui/icons";
import { CHECKPOINT_KIND, fmtDateRange, fmtNum } from "@/lib/format";
import { audienceLabel } from "@/lib/rundown";
import type { scanEvent } from "@/lib/scan-flow";

type Event = NonNullable<Awaited<ReturnType<typeof scanEvent>>>;

// Langkah 2 scan: pilih item rundown. Hanya item "Perlu scan" yang bisa dibuka; agenda tampil sebagai informasi.
export function RundownPicker({ event, base }: { event: Event; base: string }) {
  const approved = event._count.registrations;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`${base}/scan`} className="text-sm text-gray-600 hover:text-gray-900">← Pilih pelatihan lain</Link>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">{event.name}</h1>
      <p className="text-sm text-gray-600">
        {event.location} · {fmtDateRange(event.startDate, event.endDate)}
        {event.running && <span className="ml-2 font-semibold text-green-700">· Sedang berlangsung</span>}
      </p>
      <p className="mt-4 text-sm font-medium text-gray-900">Pilih rundown yang akan dipindai</p>

      <ol className="mt-2 space-y-2">
        {event.checkpoints.length === 0 && <li className="card p-5 text-sm text-gray-600">Pelatihan ini belum punya rundown.</li>}
        {event.checkpoints.map((c, i) =>
          c.scan ? (
            <li key={c.id}>
              <Link
                href={`${base}/events/${event.id}/scan/${c.id}`}
                className="card card-link flex items-center gap-4 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">
                    {c.name}
                    {audienceLabel(c) && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Khusus {audienceLabel(c)}</span>}
                  </p>
                  <p className="text-xs text-gray-600">
                    {CHECKPOINT_KIND[c.kind] ?? c.kind} · {fmtNum(c._count.scans)} / {fmtNum(approved)} sudah dipindai
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-gray-200">
                    <div className="h-full bg-green-600" style={{ width: `${approved ? Math.min(100, (c._count.scans / approved) * 100) : 0}%` }} />
                  </div>
                </div>
                <span className="btn btn-primary btn-sm shrink-0">
                  <QrCodeIcon width={16} height={16} />
                  Mulai scan
                </span>
              </Link>
            </li>
          ) : (
            <li key={c.id} className="flex items-center gap-4 rounded-md border border-dashed border-gray-200 px-4 py-3 text-gray-500">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700">{c.name}</p>
                <p className="text-xs">Agenda saja · tidak dipindai</p>
              </div>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
