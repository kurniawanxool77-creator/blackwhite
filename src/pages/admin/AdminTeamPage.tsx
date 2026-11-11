import { PageHeader } from "@/components/admin/PageHeader";
import { TeamMemberCard, type Member } from "@/components/admin/TeamMemberCard";
import { fmtTime } from "@/lib/format";
import { attendanceStatus } from "@/lib/schedule";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

type TeamEvent = { id: string; name: string; startDate: Date; endDate: Date; status: string; admins: Member[] };
type AttendanceTodayRow = { adminId: string; eventId: string; checkIn: Date; checkOut: Date | null };

export function AdminTeamPage() {
  const { user } = useAuth();
  const state = useApiData<{ events: TeamEvent[]; superadmins: Member[]; attendance: AttendanceTodayRow[] }>("/api/admin/tim");

  return (
    <DataGate state={state}>
      {({ events, superadmins, attendance }) => (
        <div className="space-y-6">
          <PageHeader title="Tim panitia" description="Kontak panitia bertugas dan superadmin penyelenggara." />

          {superadmins.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Penanggung jawab & Superadmin</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {superadmins.map((m) => (
                  <TeamMemberCard key={m.id} member={m} isMe={m.id === user?.id} href={`/admin/tim/${m.id}`} />
                ))}
              </div>
            </section>
          )}

          {events.map((e) => (
            <section key={e.id} className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">{e.name}</h2>
              {e.admins.length === 0 ? (
                <p className="card p-4 text-sm text-gray-500">Belum ada panitia ditugaskan.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {e.admins.map((m) => {
                    const row = attendance.find((a) => a.adminId === m.id && a.eventId === e.id);
                    const status = attendanceStatus(row, fmtTime);
                    return (
                      <TeamMemberCard
                        key={m.id}
                        member={m}
                        isMe={m.id === user?.id}
                        href={`/admin/tim/${m.id}`}
                        status={status}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </DataGate>
  );
}

