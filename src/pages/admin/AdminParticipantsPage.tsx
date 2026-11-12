import type { Checkpoint, Event, Registration, Scan, User } from "@prisma/client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtNum } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type RegRow = Registration & {
  user: Pick<User, "id" | "name" | "email" | "phone" | "organization" | "image">;
  event: Event & { checkpoints: Checkpoint[] };
  scans: (Scan & { checkpoint: Checkpoint })[];
};

export function AdminParticipantsPage() {
  const state = useApiData<{ registrations: RegRow[] }>("/api/admin/peserta");
  const [q, setQ] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  return (
    <DataGate state={state}>
      {({ registrations }) => {
        const eventsMap = new Map<string, string>();
        for (const r of registrations) eventsMap.set(r.event.id, r.event.name);
        const query = q.trim().toLowerCase();
        const filtered = registrations.filter((r) => {
          if (eventFilter && r.eventId !== eventFilter) return false;
          if (!query) return true;
          return (
            r.user.name.toLowerCase().includes(query) ||
            r.user.email.toLowerCase().includes(query) ||
            (r.code ?? "").toLowerCase().includes(query) ||
            (r.user.organization ?? "").toLowerCase().includes(query)
          );
        });

        return (
          <div className="space-y-5">
            <PageHeader title="Daftar peserta disetujui" description={`Total ${fmtNum(registrations.length)} peserta pada event yang Anda pegang.`} />

            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, kode, email, atau instansi..."
                className="input max-w-xs text-sm"
              />
              {eventsMap.size > 1 && (
                <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="input w-auto text-sm">
                  <option value="">Semua event ({fmtNum(eventsMap.size)})</option>
                  {Array.from(eventsMap.entries()).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="card p-6 text-sm text-gray-600">Tidak ada peserta yang cocok.</div>
            ) : (
              <div className="card overflow-hidden">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Peserta</th>
                      <th>Event</th>
                      <th>Progres pos</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const details = readDetails(r.details);
                      const expected = r.event.checkpoints.filter((c) => appliesTo(c, details)).length;
                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={r.user.name} image={r.user.image} size={32} />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {r.code && <span className="mr-1.5 font-mono text-xs text-gray-500">{r.code}</span>}
                                  {r.user.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">{r.user.organization || r.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-gray-700">{r.event.name}</td>
                          <td className="tabular-nums text-gray-700">
                            {fmtNum(r.scans.length)} / {fmtNum(expected)} pos
                          </td>
                          <td className="text-right">
                            <Link to={`/admin/events/${r.eventId}/peserta/${r.id}`} className="btn btn-secondary btn-sm">Detail</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

