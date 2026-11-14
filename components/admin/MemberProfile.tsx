import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtDate, fmtDuration, fmtNum } from "@/lib/format";
import type { MemberDetail } from "@/lib/team";
import { AttendanceHistory } from "./AttendanceHistory";
import { waNumber } from "./TeamMemberCard";
import { deleteAttendance } from "@/src/lib/actions/superadmin";

// Profil anggota tim ala HRIS: identitas, kontak, tugas, pelatihan yang dipegang, statistik, dan riwayat absensi.
export function MemberProfile({
  detail,
  backHref,
  isMe,
  canDeleteAttendance,
}: {
  detail: MemberDetail;
  backHref: string;
  isMe: boolean;
  canDeleteAttendance?: boolean;
}) {
  const { member, events, attendance, scanCount } = detail;
  const duties = member.duties ? member.duties.split("\n") : [];
  const worked = attendance.reduce((sum, a) => sum + (a.checkOut ? +a.checkOut - +a.checkIn : 0), 0);
  const stats = [
    { label: "Hari hadir", value: fmtNum(new Set(attendance.map((a) => a.date)).size) },
    { label: "Total jam bertugas", value: fmtDuration(worked) },
    { label: "Peserta dipindai", value: fmtNum(scanCount) },
    { label: "Event", value: fmtNum(events.length) },
  ];

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm text-gray-600 hover:text-gray-900">← Tim</Link>

      <section className="card flex flex-wrap items-start gap-5 p-5">
        <UserAvatar name={member.name} image={member.image} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {member.name}
            {isMe && <span className="ml-2 text-sm font-medium text-gray-500">(Anda)</span>}
          </h1>
          <p className="text-gray-700">{member.position || (member.role === "superadmin" ? "Superadmin" : "Panitia")}</p>
          <p className="mt-1 text-sm text-gray-600">
            {member.role === "superadmin" ? "Superadmin" : "Panitia"} · bergabung {fmtDate(member.createdAt)}
            {!member.active && <span className="ml-2 font-semibold text-red-700">Nonaktif</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.phone && (
              <>
                <a href={`tel:${member.phone.replace(/[^\d+]/g, "")}`} className="btn btn-secondary btn-sm">
                  <PhoneIcon width={16} height={16} />
                  {member.phone}
                </a>
                <a href={`https://wa.me/${waNumber(member.phone)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm border-green-200 bg-green-50 text-green-800 hover:bg-green-100">
                  WhatsApp
                </a>
              </>
            )}
            <a href={`mailto:${member.email}`} className="btn btn-secondary btn-sm">
              <MailIcon width={16} height={16} />
              {member.email}
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-gray-900">Tugas</h2>
          {duties.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">Belum ada tugas yang diatur Superadmin.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {duties.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="font-semibold text-gray-900">Event yang dipegang</h2>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">{member.role === "superadmin" ? "Superadmin memegang semua event." : "Belum ada."}</p>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 py-2">
                  <span className="text-gray-900">{e.name}</span>
                  <span className="whitespace-nowrap text-gray-600">{fmtDate(e.startDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold text-gray-900">Riwayat absensi</h2>
        <AttendanceHistory
          rows={attendance}
          onDelete={canDeleteAttendance ? deleteAttendance : undefined}
        />
      </section>
    </div>
  );
}
