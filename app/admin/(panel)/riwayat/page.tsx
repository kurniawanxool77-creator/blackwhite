import Link from "next/link";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { requireAdmin } from "@/lib/auth";
import { canUndoScan, UNDO_MINUTES } from "@/lib/checkin";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNum } from "@/lib/format";
import { undoScan } from "@/lib/scan";

export const dynamic = "force-dynamic";

const LIMIT = 200;

// Riwayat scan di pelatihan yang ditugaskan ke panitia ini: oleh siapa pun (default) atau hanya oleh dirinya.
export default async function ScanHistoryPage({ searchParams }: PageProps<"/admin/riwayat">) {
  const admin = await requireAdmin("scanner");
  const mine = (await searchParams).oleh === "saya";
  const scans = await db.scan.findMany({
    where: mine ? { adminId: admin.id } : { checkpoint: { event: { admins: { some: { id: admin.id } } } } },
    include: {
      admin: { select: { name: true } },
      registration: { include: { user: true } },
      checkpoint: { include: { event: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });
  const tab = (active: boolean) => `rounded px-3 py-1.5 text-sm ${active ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-100"}`;

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900">Riwayat scan</h1>
      <p className="mt-1 text-sm text-gray-600">
        Check-in di pelatihan yang ditugaskan kepada Anda, oleh Anda maupun panitia lain. Scan milik Anda bisa dibatalkan dalam {UNDO_MINUTES} menit;
        selebihnya hubungi Superadmin.
      </p>

      <nav aria-label="Filter petugas" className="mt-4 flex flex-wrap items-center gap-1">
        <Link href="/admin/riwayat" aria-current={!mine ? "page" : undefined} className={tab(!mine)}>Semua panitia</Link>
        <Link href="/admin/riwayat?oleh=saya" aria-current={mine ? "page" : undefined} className={tab(mine)}>Oleh saya</Link>
        <span className="ml-2 text-sm text-gray-600">{fmtNum(scans.length)}{scans.length === LIMIT ? " terakhir" : ""} scan</span>
      </nav>

      <div className="card mt-3 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Peserta</th>
              <th>Pelatihan · rundown</th>
              <th>Petugas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500">Belum ada scan.</td>
              </tr>
            )}
            {scans.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap">{fmtDateTime(s.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={s.registration.user.name} image={s.registration.user.image} size={32} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/events/${s.checkpoint.event.id}/peserta/${s.registrationId}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {s.registration.user.name}
                      </Link>
                      <p className="text-xs text-gray-500">{s.registration.user.organization ?? s.registration.user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p>{s.checkpoint.name}</p>
                  <p className="text-xs text-gray-500">{s.checkpoint.event.name}</p>
                </td>
                <td className={s.adminId === admin.id ? "font-medium text-gray-900" : "text-gray-700"}>
                  {s.adminId === admin.id ? "Anda" : s.admin.name}
                </td>
                <td className="text-right">
                  {canUndoScan(admin, s) && (
                    <form action={undoScan.bind(null, s.id)}>
                      <ConfirmSubmit message={`Batalkan check-in ${s.registration.user.name} di "${s.checkpoint.name}"?`} className="btn btn-danger btn-sm">
                        Batalkan
                      </ConfirmSubmit>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
