import { AttendanceHistory } from "@/components/admin/AttendanceHistory";
import { AttendancePanel } from "@/components/admin/AttendancePanel";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const admin = await requireAdmin("scanner");
  const rows = await db.attendance.findMany({
    where: { adminId: admin.id },
    include: { event: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { checkIn: "desc" }],
    take: 60,
  });

  return (
    <div className="space-y-6">
      <h1 className="hidden text-xl font-semibold text-gray-900 md:block">Absensi</h1>
      <AttendancePanel adminId={admin.id} />
      <section>
        <h2 className="mb-2 text-base font-semibold text-gray-900">Riwayat</h2>
        <AttendanceHistory rows={rows} />
      </section>
    </div>
  );
}
