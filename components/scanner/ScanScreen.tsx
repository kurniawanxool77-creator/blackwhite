import type { Admin } from "@prisma/client";
import Link from "next/link";
import { QrCodeIcon } from "@/components/ui/icons";
import { fmtDateRange, fmtNum } from "@/lib/format";
import { scanEvents } from "@/lib/scan-flow";

// Langkah 1 scan (/admin/scan, /superadmin/scan): pilih pelatihan. Yang sedang berlangsung di atas.
export async function ScanScreen({ admin }: { admin: Admin }) {
  const events = await scanEvents(admin);
  const base = admin.role === "superadmin" ? "/superadmin" : "/admin";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Scanner</h1>
      <p className="mt-1 text-sm text-gray-600">Pilih pelatihan, lalu pilih item rundown yang akan dipindai.</p>
      {events.length === 0 ? (
        <p className="card mt-4 p-6 text-sm text-gray-600">
          Tidak ada pelatihan aktif{admin.role === "scanner" ? " yang ditugaskan kepada Anda" : ""}. Pelatihan harus berstatus
          dibuka atau ditutup untuk bisa dipindai.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {events.map((e) => (
            <li key={e.id} className={`card flex flex-wrap items-center gap-4 p-4 ${e.running ? "border-green-300" : ""}`}>
              <div className="min-w-0 flex-1">
                {e.running && (
                  <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden />
                    Sedang berlangsung
                  </span>
                )}
                <p className="font-semibold text-gray-900">{e.name}</p>
                <p className="text-sm text-gray-600">
                  {e.location} · {fmtDateRange(e.startDate, e.endDate)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {fmtNum(e._count.checkpoints)} pos perlu scan · {fmtNum(e._count.registrations)} peserta disetujui
                </p>
              </div>
              <Link href={`${base}/events/${e.id}/scan`} className={`btn ${e.running ? "btn-primary" : "btn-secondary"}`}>
                <QrCodeIcon width={18} height={18} />
                Scan
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
