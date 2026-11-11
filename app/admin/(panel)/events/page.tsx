import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QrCodeIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { isRunning, todayKeyJakarta } from "@/lib/checkin";
import { AttendanceButton } from "@/components/admin/AttendanceButton";
import { db } from "@/lib/db";
import { EVENT_STATUS, fmtDate, fmtNum } from "@/lib/format";

export default async function AdminEventsPage() {
  const admin = await requireAdmin("scanner");
  const events = await db.event.findMany({
    where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
    include: { _count: { select: { checkpoints: { where: { scan: true } }, registrations: { where: { status: "approved" } } } } },
    orderBy: { startDate: "asc" },
  });
  const onDuty = new Set(
    (await db.attendance.findMany({ where: { adminId: admin.id, date: todayKeyJakarta(), checkOut: null }, select: { eventId: true } })).map((a) => a.eventId),
  );

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900">Event saya</h1>
      <p className="mt-1 text-sm text-gray-600">Event yang ditugaskan Superadmin kepada Anda.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th className="text-right">Peserta</th>
              <th className="text-right">Checkpoint</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500">Belum ada event yang ditugaskan.</td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/admin/events/${e.id}`} className="font-medium text-brand hover:underline">{e.name}</Link>
                  <p className="text-xs text-gray-500">{e.location}</p>
                  {isRunning(e) && <p className="mt-0.5 text-xs font-semibold text-green-700">Sedang berlangsung</p>}
                </td>
                <td className="whitespace-nowrap">{fmtDate(e.startDate)}</td>
                <td><StatusBadge status={e.status} label={EVENT_STATUS[e.status]} /></td>
                <td className="text-right">{fmtNum(e._count.registrations)}</td>
                <td className="text-right">{fmtNum(e._count.checkpoints)}</td>
                <td className="text-right">
                  {onDuty.has(e.id) && !e.useQr ? (
                    <Link href={`/admin/events/${e.id}`} className="btn btn-secondary btn-sm">Tandai hadir</Link>
                  ) : onDuty.has(e.id) ? (
                    <Link href={`/admin/events/${e.id}/scan`} className="btn btn-primary btn-sm" aria-label={`Scan ${e.name}`}>
                      <QrCodeIcon width={16} height={16} />
                      Scan
                    </Link>
                  ) : isRunning(e) && e.status !== "done" ? (
                    <AttendanceButton eventId={e.id} type="in" className="btn btn-success btn-sm" />
                  ) : (
                    <span className="text-xs text-gray-500">Terkunci</span>
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
