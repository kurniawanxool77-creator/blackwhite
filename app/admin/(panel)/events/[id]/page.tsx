import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { CheckpointPanel } from "@/components/admin/CheckpointPanel";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { QrCodeIcon } from "@/components/ui/icons";
import { AttendanceButton } from "@/components/admin/AttendanceButton";
import { isOnDuty } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { isRunning } from "@/lib/checkin";
import { queryParam } from "@/lib/event-search";
import { getEventDetail } from "@/lib/event-detail";
import { fmtDateRange } from "@/lib/format";
import { parseFields } from "@/lib/registration-form";
import { FormFieldList } from "@/components/admin/FormFieldList";
import { ShuttlePanel } from "@/components/admin/ShuttlePanel";
import { dayKey } from "@/lib/schedule";
import { shuttleManifest } from "@/lib/shuttle";

export default async function AdminEventDetailPage({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  const admin = await requireAdmin("scanner");
  const { id } = await params;
  const sp = await searchParams;
  const filter = typeof sp.status === "string" ? sp.status : "approved";

  const q = queryParam(sp.q);
  const data = await getEventDetail(id, filter, admin.id, q);
  if (!data) notFound();
  const { event, registrations, counts, eligible } = data;
  const fields = parseFields(event.formFields);
  const routes = await shuttleManifest(event.id); // daftar penumpang untuk panitia penjemputan
  const onDuty = await isOnDuty(admin.id, event.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm text-gray-500 hover:text-brand">← Event saya</Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-600">
            {event.location} · {fmtDateRange(event.startDate, event.endDate)}
          </p>
        </div>
        {onDuty ? (
          <div className="flex flex-wrap items-start gap-2">
            {event.useQr && <Link href={`/admin/events/${event.id}/scan`} className="btn btn-primary">
              <QrCodeIcon width={18} height={18} />
              Scan
            </Link>}
            <AttendanceButton eventId={event.id} type="out" />
          </div>
        ) : isRunning(event) ? (
          <AttendanceButton eventId={event.id} type="in" />
        ) : (
          <span className="text-sm text-gray-600">Absensi & scan dibuka saat hari pelatihan</span>
        )}
      </div>

      {!onDuty && isRunning(event) && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Fitur event terkunci. Absen datang dengan foto selfie untuk membuka scan dan check-in manual.
        </p>
      )}

      <FormFieldList fields={fields} />
      <CheckpointPanel eventId={event.id} checkpoints={event.checkpoints} eligible={eligible} fields={fields} readOnly />
      {routes.length > 0 && <ShuttlePanel eventId={event.id} routes={routes} defaultDate={dayKey(event.startDate)} detailBase={`/admin/events/${event.id}/peserta`} readOnly />}
      <RegistrationTable
        eventId={event.id}
        filter={filter}
        counts={counts}
        checkpoints={event.checkpoints}
        registrations={registrations}
        q={q}
        detailBase={`/admin/events/${event.id}/peserta`}
        readOnly
      />
      <AutoRefresh seconds={20} />
    </div>
  );
}
