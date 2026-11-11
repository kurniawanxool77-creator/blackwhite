import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckpointPanel } from "@/components/admin/CheckpointPanel";
import { EventDetailHeader } from "@/components/admin/EventDetailHeader";
import { EventForm } from "@/components/admin/EventForm";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { ShuttlePanel } from "@/components/admin/ShuttlePanel";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategories, getEventDetail } from "@/lib/event-detail";
import { queryParam } from "@/lib/event-search";
import { parseGallery } from "@/lib/gallery";
import { parseFields } from "@/lib/registration-form";
import { dayKey } from "@/lib/schedule";
import { shuttleManifest } from "@/lib/shuttle";
import { deleteEvent, saveFormFields, setEventAdmins, setEventStatus, updateEvent } from "../actions";

export default async function EventDetailPage({ params, searchParams }: PageProps<"/superadmin/events/[id]">) {
  await requireAdmin("superadmin");
  const { id } = await params;
  const sp = await searchParams;
  const q = queryParam(sp.q);
  const activeTab = typeof sp.tab === "string" ? sp.tab : "peserta";

  const [data, categories, team] = await Promise.all([
    getEventDetail(id, "all", undefined, q),
    getCategories(),
    db.admin.findMany({
      where: { role: "scanner", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, position: true, events: { where: { id }, select: { id: true } } },
    }),
  ]);
  if (!data) notFound();

  const { event, registrations, counts, eligible } = data;
  const isCourse = event.type === "course";
  const isOnline = event.mode === "online";

  // Default filter pintar: jika tidak ada yang pending tapi ada yang disetujui, langsung tampilkan yang disetujui
  const defaultFilter =
    (counts.pending ?? 0) > 0
      ? "pending"
      : (counts.approved ?? 0) > 0
      ? "approved"
      : (counts.rejected ?? 0) > 0
      ? "rejected"
      : "all";
  const filter = typeof sp.status === "string" ? sp.status : defaultFilter;

  // Filter list registrasi sesuai filter aktif
  const activeRegistrations =
    filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

  const fields = parseFields(event.formFields);
  const routes = await shuttleManifest(event.id);
  const assignedTeam = team.filter((a) => a.events.length > 0);
  const totalRegistrations = Object.values(counts).reduce((a, b) => a + b, 0);

  // Tab kontekstual sesuai tipe & mode event
  const TABS = isCourse
    ? [
        { id: "peserta", label: "Peserta Terdaftar", badge: `${totalRegistrations}` },
        { id: "materi", label: "Materi & Kuis", badge: "Video & Kuis" },
        { id: "formulir", label: "Formulir Pendaftaran", badge: `${fields.length}` },
        { id: "pengaturan", label: "Pengaturan Pelatihan", badge: "" },
      ]
    : isOnline
    ? [
        { id: "peserta", label: "Peserta Terdaftar", badge: `${totalRegistrations}` },
        { id: "webinar", label: "Akses & Jadwal Webinar", badge: event.checkpoints.length ? `${event.checkpoints.length} sesi` : "" },
        { id: "formulir", label: "Formulir Kebutuhan", badge: `${fields.length}` },
        ...(event.certificate ? [{ id: "materi", label: "Materi & Sertifikat", badge: "" }] : []),
        { id: "pengaturan", label: "Pengaturan Event", badge: "" },
      ]
    : [
        { id: "peserta", label: "Peserta Terdaftar", badge: `${totalRegistrations}` },
        { id: "tim", label: "Tim Bertugas", badge: `${assignedTeam.length}` },
        { id: "rundown", label: "Rundown & Pos QR", badge: `${event.checkpoints.length}` },
        { id: "formulir", label: "Formulir Kebutuhan", badge: `${fields.length}` },
        ...(event.certificate ? [{ id: "materi", label: "Materi & Sertifikat", badge: "" }] : []),
        { id: "pengaturan", label: "Pengaturan Event", badge: "" },
      ];

  const tabHref = (tabId: string) => {
    const params = new URLSearchParams();
    params.set("tab", tabId);
    if (filter) params.set("status", filter);
    if (q) params.set("q", q);
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <EventDetailHeader event={event} statusAction={setEventStatus.bind(null, event.id)} />

      {/* Navigasi Tab Kontekstual */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 overflow-x-auto no-scrollbar" aria-label="Tab Kelola Event">
          {TABS.map((t) => {
            const on = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={tabHref(t.id)}
                className={`group inline-flex items-center gap-2 border-b-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  on
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      on ? "bg-green-100 text-brand" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: Peserta Terdaftar */}
      {activeTab === "peserta" && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* TAB: Akses & Jadwal Webinar (Khusus Event Online) */}
      {activeTab === "webinar" && isOnline && (
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-base font-semibold text-gray-900">Akses Platform Webinar</h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Informasi platform tatap maya (Zoom / Google Meet) yang dapat dilihat oleh peserta yang telah disetujui.
            </p>
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-900">Platform & Lokasi</span>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">{event.location}</p>
                </div>
                <Link
                  href={tabHref("pengaturan")}
                  className="btn btn-secondary btn-sm"
                >
                  Ubah Tautan / Lokasi
                </Link>
              </div>
            </div>
          </section>

          <div className="card p-4">
            <h2 className="text-base font-semibold text-gray-900">Jadwal Sesi & Agenda Webinar</h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Kelola susunan sesi materi dan agenda yang akan diikuti oleh peserta secara online.
            </p>
          </div>
          <CheckpointPanel
            eventId={event.id}
            checkpoints={event.checkpoints}
            eligible={eligible}
            fields={fields}
            defaultDate={dayKey(event.startDate)}
          />
        </div>
      )}

      {/* TAB 2: Tim Bertugas (Khusus Event Offline / Hybrid) */}
      {activeTab === "tim" && !isCourse && !isOnline && (
        <section className="card">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">
              Tim Bertugas
              <span className="ml-2 text-xs font-normal text-gray-500">({assignedTeam.length} orang ditugaskan)</span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Centang anggota tim yang bertugas pada pelatihan ini. Hanya tim terpilih yang memiliki akses scan tiket dan absensi di venue.
            </p>
          </div>
          <form action={setEventAdmins.bind(null, event.id)} className="p-5">
            {team.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada akun tim. Tambahkan di menu{" "}
                <Link href="/superadmin/admins" className="text-brand hover:underline font-medium">
                  Tim & admin
                </Link>.
              </p>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {team.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2.5 rounded-md border border-gray-200 p-3 text-sm transition has-checked:border-brand has-checked:bg-green-50/60"
                  >
                    <input
                      type="checkbox"
                      name="admins"
                      value={a.id}
                      defaultChecked={a.events.length > 0}
                      className="h-4 w-4 accent-brand cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block font-semibold text-gray-900">{a.name}</span>
                      <span className="block truncate text-xs text-gray-500">{a.position || "Tim Pelaksana"}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button className="btn btn-primary btn-sm">Simpan Tim Bertugas</button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 3: Formulir Kebutuhan Pendaftaran */}
      {activeTab === "formulir" && (
        <section className="card">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">
              Formulir Kebutuhan Pendaftaran
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({fields.length ? `${fields.length} isian data` : "daftar cepat"})
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Atur kebutuhan data dan kuesioner dari calon peserta (seperti pilihan paket, riwayat kesehatan, atau kontak darurat).
            </p>
          </div>
          <div className="p-5">
            <FormBuilder action={saveFormFields.bind(null, event.id)} defaultValue={fields} />
          </div>
        </section>
      )}

      {/* TAB 4: Rundown & Checkpoint QR (Hanya Jika Tatap Muka / Hybrid) */}
      {activeTab === "rundown" && !isCourse && !isOnline && (
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-base font-semibold text-gray-900">
              Rundown & Checkpoint QR Lapangan
            </h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Konfigurasi pos-pos pemindaian QR tiket peserta di venue: absensi masuk, konsumsi, pembagian kit pelatihan, dan antar-jemput.
            </p>
          </div>
          <CheckpointPanel
            eventId={event.id}
            checkpoints={event.checkpoints}
            eligible={eligible}
            fields={fields}
            defaultDate={dayKey(event.startDate)}
          />
          <ShuttlePanel
            eventId={event.id}
            routes={routes}
            defaultDate={dayKey(event.startDate)}
            detailBase={`/superadmin/events/${event.id}/peserta`}
          />
        </div>
      )}

      {/* TAB 5: Materi & Sertifikat */}
      {activeTab === "materi" && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Materi Pembelajaran, Kuis & Sertifikat
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Atur modul materi video pelatihan, bank soal kuis, nilai kelulusan, dan penerbitan sertifikat digital otomatis.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2.5 py-1 text-gray-700 font-medium">
                  Status Sertifikat: <b>{event.certificate ? "Aktif" : "Non-aktif"}</b>
                </span>
                <span className="rounded bg-gray-100 px-2.5 py-1 text-gray-700 font-medium">
                  Nilai Minimal Lulus: <b>{event.passScore}%</b>
                </span>
              </div>
            </div>
            <Link
              href={`/superadmin/events/${event.id}/belajar`}
              className="btn btn-primary"
            >
              Buka Pengaturan Materi & Kuis →
            </Link>
          </div>
        </section>
      )}

      {/* TAB 6: Pengaturan Event */}
      {activeTab === "pengaturan" && (
        <section className="card">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-base font-semibold text-gray-900">
              Pengaturan & Info Event
            </h2>
            <p className="mt-0.5 text-xs text-gray-600">
              Ubah rincian acara, kategori, mode pelatihan, tanggal pelaksanaan, harga, diskon, dan kuota.
            </p>
          </div>
          <div className="p-5">
            <EventForm
              action={updateEvent.bind(null, event.id)}
              categories={categories}
              event={{
                name: event.name,
                category: event.category,
                mode: event.mode,
                coverUrl: event.coverUrl,
                gallery: parseGallery(event.gallery),
                location: event.location,
                startDate: event.startDate,
                endDate: event.endDate,
                price: event.price,
                discount: event.discount,
                quota: event.quota,
                description: event.description,
                useQr: event.useQr,
                type: event.type,
                autoApprove: event.autoApprove,
                registrationEnd: event.registrationEnd,
                codePrefix: event.codePrefix,
              }}
            />

            <div className="mt-8 border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-red-700">Zona Bahaya</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Menghapus event akan menghapus seluruh data pendaftaran, riwayat scan, dan sertifikat terkait secara permanen.
              </p>
              <div className="mt-3">
                <form action={deleteEvent.bind(null, event.id)}>
                  <ConfirmSubmit
                    message={`Hapus event "${event.name}"? Tindakan ini tidak dapat dibatalkan.`}
                    className="btn btn-danger btn-sm"
                  >
                    Hapus Event Ini
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
