import type { Checkpoint, Event, Registration, User } from "@prisma/client";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EventDetailHeader } from "@/components/admin/EventDetailHeader";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { parseFields } from "@/lib/registration-form";
import type { shuttleManifest } from "@/lib/shuttle";
import { DataGate } from "@/src/components/RouteState";
import { setEventStatus } from "@/src/lib/actions/events";
import { useApiData } from "@/src/lib/api-client";
import { EventConfigTabs } from "./EventConfigTabs";

type DetailPayload = {
  event: Event & {
    checkpoints: (Checkpoint & { _count: { scans: number } })[];
    _count: { lessons: number; questions: number };
  };
  registrations: (Registration & { user: User; _count: { scans: number } })[];
  counts: Record<string, number>;
  eligible: Record<string, number>;
  categories: string[];
  team: { id: string; name: string; position: string; events: { id: string }[] }[];
  routes: Awaited<ReturnType<typeof shuttleManifest>>;
};

export function SuperadminEventDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const requestedTab = searchParams.get("tab") || "peserta";

  const apiUrl = id
    ? `/api/superadmin/events/${encodeURIComponent(id)}${q ? `?q=${encodeURIComponent(q)}` : ""}`
    : null;
  const state = useApiData<DetailPayload>(apiUrl);

  return (
    <DataGate state={state} notFoundTitle="Event tidak ditemukan" backTo="/superadmin/events">
      {({ event, registrations, counts, eligible, categories, team, routes }) => {
        const isCourse = event.type === "course";
        const isOnline = event.mode === "online";
        const fields = parseFields(event.formFields);
        const totalRegs = (counts.pending ?? 0) + (counts.approved ?? 0) + (counts.rejected ?? 0);
        const assignedTeam = team.filter((a) => a.events.length > 0);
        const defaultFilter =
          (counts.pending ?? 0) > 0
            ? "pending"
            : (counts.approved ?? 0) > 0
              ? "approved"
              : (counts.rejected ?? 0) > 0
                ? "rejected"
                : "all";
        const filter = searchParams.get("status") || defaultFilter;
        const activeRegistrations = filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

        const tabs: { id: string; label: string; badge?: string }[] = [
          { id: "peserta", label: "Peserta", badge: totalRegs ? String(totalRegs) : undefined },
          ...(isOnline ? [{ id: "webinar", label: "Webinar & Sesi", badge: event.checkpoints.length ? String(event.checkpoints.length) : undefined }] : []),
          ...(!isCourse && !isOnline
            ? [
                { id: "tim", label: "Tim Bertugas", badge: assignedTeam.length ? String(assignedTeam.length) : undefined },
                { id: "rundown", label: "Rundown & QR", badge: event.checkpoints.length ? String(event.checkpoints.length) : undefined },
              ]
            : []),
          { id: "formulir", label: "Formulir Daftar", badge: fields.length ? String(fields.length) : undefined },
          { id: "materi", label: "Materi & Sertifikat", badge: event.certificate ? "Aktif" : undefined },
          { id: "pengaturan", label: "Pengaturan" },
        ];

        const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : "peserta";
        const tabHref = (t: string) => `/superadmin/events/${event.id}?tab=${t}`;

        return (
          <div className="space-y-5">
            <EventDetailHeader
              event={event as Parameters<typeof EventDetailHeader>[0]["event"]}
              statusAction={async (f) => { await setEventStatus(event.id, f); }}
            />

            <div className="border-b border-gray-200">
              <nav className="no-scrollbar -mb-px flex space-x-2 overflow-x-auto" aria-label="Tab Kelola Event">
                {tabs.map((t) => {
                  const on = activeTab === t.id;
                  return (
                    <Link
                      key={t.id}
                      to={tabHref(t.id)}
                      className={`group inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                        on ? "border-brand text-brand" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <span>{t.label}</span>
                      {t.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${on ? "bg-green-100 text-brand" : "bg-gray-100 text-gray-600"}`}>
                          {t.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {activeTab === "peserta" ? (
              <RegistrationTable
                eventId={event.id}
                filter={filter}
                counts={counts}
                checkpoints={event.checkpoints}
                registrations={activeRegistrations}
                q={q}
                tab={activeTab}
                mode={event.mode}
                useQr={event.useQr}
                detailBase={`/superadmin/events/${event.id}/peserta`}
              />
            ) : (
              <EventConfigTabs
                activeTab={activeTab}
                event={event}
                eligible={eligible}
                fields={fields}
                categories={categories}
                team={team}
                routes={routes}
                tabHref={tabHref}
              />
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

