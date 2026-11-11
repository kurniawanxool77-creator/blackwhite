import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPesertaPage({ searchParams }: PageProps<"/admin/peserta">) {
  const admin = await requireAdmin("scanner");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "all";

  // Ambil semua peserta di event yang ditugaskan kepada panitia ini
  const registrations = await db.registration.findMany({
    where: {
      event: { admins: { some: { id: admin.id } } },
      status: "approved",
    },
    include: {
      user: true,
      event: { include: { checkpoints: { where: { scan: true }, orderBy: { order: "asc" } } } },
      scans: { include: { checkpoint: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = registrations.filter((r) => {
    // Filter pencarian teks
    const matchQ =
      !q ||
      [r.user.name, r.user.email, r.user.phone ?? "", r.user.organization ?? "", r.event.name]
        .some((t) => t.toLowerCase().includes(q));

    // Filter status kehadiran
    if (!matchQ) return false;
    if (filter === "hadir") return r.scans.length > 0;
    if (filter === "belum") return r.scans.length === 0;
    return true;
  });

  const totalAll = registrations.length;
  const totalHadir = registrations.filter((r) => r.scans.length > 0).length;
  const totalBelum = totalAll - totalHadir;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Daftar & Deteksi Peserta</h1>
          <p className="text-xs text-gray-600">
            Pantau kehadiran peserta yang sudah login / masuk di pos checkpoint event Anda.
          </p>
        </div>
        <Link href="/admin/events" className="btn btn-primary btn-sm text-xs w-fit">
          Buka Scanner QR
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/admin/peserta"
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                filter === "all"
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Semua Peserta ({fmtNum(totalAll)})
            </Link>
            <Link
              href="/admin/peserta?filter=hadir"
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                filter === "hadir"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              ✓ Sudah Hadir ({fmtNum(totalHadir)})
            </Link>
            <Link
              href="/admin/peserta?filter=belum"
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                filter === "belum"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Belum Hadir ({fmtNum(totalBelum)})
            </Link>
          </div>

          <form method="GET" action="/admin/peserta" className="relative">
            <input type="hidden" name="filter" value={filter} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari nama, email, HP..."
              className="input text-xs py-1.5 pl-8 w-full sm:w-60"
            />
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </form>
        </div>
      </div>

      {/* Tabel Peserta & Status Masuk */}
      <div className="card overflow-x-auto">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Identitas Peserta</th>
              <th>Event</th>
              <th>Status Kedeteksi</th>
              <th>Pos Terakhir Hadir</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Tidak ada data peserta yang cocok dengan filter atau pencarian.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const totalCp = r.event.checkpoints.length;
              const doneCp = r.scans.length;
              const isPresent = doneCp > 0;
              const lastScan = r.scans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

              let details: Record<string, string> = {};
              try {
                details = JSON.parse(r.details || "{}");
              } catch {
                // ignore
              }

              return (
                <tr key={r.id} className="hover:bg-gray-50/70">
                  <td>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={r.user.name} image={r.user.image} size={36} />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/events/${r.eventId}/peserta/${r.id}`}
                          className="font-bold text-brand hover:underline truncate block"
                        >
                          {r.user.name}
                        </Link>
                        <p className="text-[11px] text-gray-500 truncate">
                          {r.user.email} · {r.user.phone || "tanpa no. HP"}
                        </p>
                        {r.user.organization && (
                          <p className="text-[10px] text-gray-400 truncate">{r.user.organization}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-gray-900 block truncate max-w-[180px]">
                      {r.event.name}
                    </span>
                    {details.eventDetail && (
                      <span className="text-[10px] text-brand block truncate max-w-[180px]">
                        Alat: {details.eventDetail}
                      </span>
                    )}
                  </td>
                  <td>
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        <span>✓ Hadir</span>
                        <span className="text-[10px] font-normal">({doneCp}/{totalCp} Pos)</span>
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        Belum Hadir
                      </span>
                    )}
                  </td>
                  <td>
                    {lastScan ? (
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[150px]">
                          {lastScan.checkpoint.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {fmtDateTime(lastScan.createdAt)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Link
                      href={`/admin/events/${r.eventId}/peserta/${r.id}`}
                      className="btn btn-secondary btn-sm text-[11px] py-1"
                    >
                      Detail & Presensi
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
