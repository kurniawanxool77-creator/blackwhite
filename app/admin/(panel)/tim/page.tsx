import { TeamMemberCard } from "@/components/admin/TeamMemberCard";
import { attendanceStatus } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { isRunning, todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { fmtDate, fmtNum, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const memberSelect = { id: true, name: true, email: true, role: true, position: true, phone: true, image: true, duties: true } as const;

// Tim panitia: siapa saja di setiap pelatihan yang ditugaskan, status absensi hari ini, kontak, dan tugasnya.
export default async function TeamPage() {
  const admin = await requireAdmin("scanner");
  const today = todayKeyJakarta();
  const [events, superadmins, attendance] = await Promise.all([
    db.event.findMany({
      where: { admins: { some: { id: admin.id } }, status: { not: "done" } },
      include: { admins: { where: { active: true }, select: memberSelect, orderBy: { name: "asc" } } },
      orderBy: { startDate: "asc" },
    }),
    db.admin.findMany({ where: { role: "superadmin", active: true }, select: memberSelect, orderBy: { name: "asc" } }),
    db.attendance.findMany({ where: { date: today, event: { admins: { some: { id: admin.id } } } } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tim panitia</h1>
        <p className="mt-1 text-sm text-gray-600">Anggota tim di pelatihan yang ditugaskan kepada Anda: absensi hari ini, tugas, dan kontak. Klik nama untuk detail.</p>
      </div>

      {events.length === 0 && <p className="card p-6 text-sm text-gray-600">Belum ada pelatihan yang ditugaskan kepada Anda.</p>}

      {events.map((e) => {
        const running = isRunning(e);
        const rowOf = (id: string) => attendance.find((a) => a.adminId === id && a.eventId === e.id);
        const present = e.admins.filter((m) => rowOf(m.id)).length;
        return (
          <section key={e.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">{e.name}</h2>
              <p className="text-sm text-gray-600">
                {fmtDate(e.startDate)} · {fmtNum(e.admins.length)} anggota tim
                {running && <> · <b className="text-green-700">{fmtNum(present)} hadir hari ini</b></>}
              </p>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {e.admins.map((m) => (
                <TeamMemberCard
                  key={m.id}
                  member={m}
                  isMe={m.id === admin.id}
                  href={`/admin/tim/${m.id}`}
                  status={running ? attendanceStatus(rowOf(m.id), fmtTime) : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}

      {superadmins.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900">Penanggung jawab (Superadmin)</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {superadmins.map((m) => <TeamMemberCard key={m.id} member={m} isMe={false} href={`/admin/tim/${m.id}`} />)}
          </div>
        </section>
      )}
    </div>
  );
}
