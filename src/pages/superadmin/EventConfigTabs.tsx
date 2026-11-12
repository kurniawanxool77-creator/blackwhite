import type { Checkpoint, Event } from "@prisma/client";
import { useActionState } from "react";
import { Link } from "react-router-dom";
import { CheckpointPanel } from "@/components/admin/CheckpointPanel";
import { EventForm } from "@/components/admin/EventForm";
import { FormBuilder } from "@/components/admin/FormBuilder";
import { ShuttlePanel } from "@/components/admin/ShuttlePanel";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import type { FormField } from "@/lib/registration-form";
import { dayKey } from "@/lib/schedule";
import type { shuttleManifest } from "@/lib/shuttle";
import { deleteEvent, saveFormFields, setEventAdmins, updateEvent } from "@/src/lib/actions/events";
import { errorMessage } from "@/src/lib/rpc";

type TeamOption = { id: string; name: string; position: string; events: { id: string }[] };

function TeamAssignForm({ eventId, team }: { eventId: string; team: TeamOption[] }) {
  const [state, action, pending] = useActionState(
    async (_prev: { ok: boolean; text: string } | null, f: FormData) => {
      try {
        await setEventAdmins(eventId, f);
        return { ok: true, text: "Tim bertugas tersimpan." };
      } catch (err) {
        return { ok: false, text: errorMessage(err) };
      }
    },
    null,
  );

  return (
    <form action={action} className="p-5">
      {team.length === 0 ? (
        <p className="text-sm text-gray-500">
          Belum ada akun tim. Tambahkan di menu <Link to="/superadmin/admins" className="font-medium text-brand hover:underline">Tim & admin</Link>.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {team.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2.5 rounded-md border border-gray-200 p-3 text-sm transition has-checked:border-brand has-checked:bg-green-50/60"
            >
              <input type="checkbox" name="admins" value={a.id} defaultChecked={a.events.length > 0} className="h-4 w-4 cursor-pointer accent-brand" />
              <div className="min-w-0">
                <span className="block font-semibold text-gray-900">{a.name}</span>
                <span className="block truncate text-xs text-gray-500">{a.position || "Tim Pelaksana"}</span>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-end gap-3">
        {state && <p className={`text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.text}</p>}
        <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Menyimpan..." : "Simpan Tim Bertugas"}</button>
      </div>
    </form>
  );
}

function parseGallery(raw: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function EventConfigTabs({
  activeTab,
  event,
  eligible,
  fields,
  categories,
  team,
  routes,
  tabHref,
}: {
  activeTab: string;
  event: Event & { checkpoints: (Checkpoint & { _count: { scans: number } })[] };
  eligible: Record<string, number>;
  fields: FormField[];
  categories: string[];
  team: TeamOption[];
  routes: Awaited<ReturnType<typeof shuttleManifest>>;
  tabHref: (tab: string) => string;
}) {
  const isCourse = event.type === "course";
  const isOnline = event.mode === "online";
  const assignedTeam = team.filter((a) => a.events.length > 0);

  if (activeTab === "webinar" && isOnline) {
    return (
      <div className="space-y-4">
        <section className="card p-5">
          <h2 className="text-base font-semibold text-gray-900">Akses Platform Webinar</h2>
          <p className="mt-0.5 text-xs text-gray-600">
            Informasi platform tatap maya (Zoom / Google Meet) yang dapat dilihat oleh peserta yang telah disetujui.
          </p>
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold tracking-wider text-blue-900 uppercase">Platform & Lokasi</span>
                <p className="mt-0.5 text-sm font-bold text-gray-900">{event.location}</p>
              </div>
              <Link to={tabHref("pengaturan")} className="btn btn-secondary btn-sm">Ubah Tautan / Lokasi</Link>
            </div>
          </div>
        </section>

        <CheckpointPanel
          eventId={event.id}
          checkpoints={event.checkpoints}
          eligible={eligible}
          fields={fields}
          defaultDate={dayKey(event.startDate)}
        />
      </div>
    );
  }

  if (activeTab === "tim" && !isCourse && !isOnline) {
    return (
      <section className="card">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">
            Tim Bertugas <span className="ml-2 text-xs font-normal text-gray-500">({assignedTeam.length} orang ditugaskan)</span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-600">
            Centang anggota tim yang bertugas pada pelatihan ini. Hanya tim terpilih yang memiliki akses scan tiket dan absensi di venue.
          </p>
        </div>
        <TeamAssignForm eventId={event.id} team={team} />
      </section>
    );
  }

  if (activeTab === "formulir") {
    return (
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
    );
  }

  if (activeTab === "rundown" && !isCourse && !isOnline) {
    return (
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="text-base font-semibold text-gray-900">Rundown & Checkpoint QR Lapangan</h2>
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
    );
  }

  if (activeTab === "materi") {
    return (
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Materi Pembelajaran, Kuis & Sertifikat</h2>
            <p className="mt-1 text-xs text-gray-600">
              Atur modul materi video pelatihan, bank soal kuis, nilai kelulusan, dan penerbitan sertifikat digital otomatis.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                Status Sertifikat: <b>{event.certificate ? "Aktif" : "Non-aktif"}</b>
              </span>
              <span className="rounded bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                Nilai Minimal Lulus: <b>{event.passScore}%</b>
              </span>
            </div>
          </div>
          <Link to={`/superadmin/events/${event.id}/belajar`} className="btn btn-primary">
            Buka Pengaturan Materi & Kuis →
          </Link>
        </div>
      </section>
    );
  }

  if (activeTab === "pengaturan") {
    return (
      <section className="card">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">Pengaturan & Info Event</h2>
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
              <form action={async () => { await deleteEvent(event.id); }}>
                <ConfirmSubmit message={`Hapus event "${event.name}"? Tindakan ini tidak dapat dibatalkan.`} className="btn btn-danger btn-sm">
                  Hapus Event Ini
                </ConfirmSubmit>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

