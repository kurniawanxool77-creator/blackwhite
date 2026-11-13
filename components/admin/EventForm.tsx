"use client";

import { useActionState, useState } from "react";
import { ACTIVITIES, EVENT_TYPES, isEventType, SHUTTLE_FIELD_ID, type ActivityKey, type EventType } from "@/lib/event-types";
import { finalPrice, fmtRp } from "@/lib/format";
import { CategoryPicker } from "./CategoryPicker";
import { useDrawer } from "./Drawer";
import { ChoiceCards, NumInput, Section } from "./EventFormParts";
import { EventPhotosUpload } from "./EventPhotosUpload";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;
type EventValues = {
  name: string;
  category: string;
  mode: string;
  coverUrl: string | null;
  gallery: string[];
  location: string;
  startDate: Date;
  endDate: Date;
  price: number;
  discount: number;
  quota: number | null;
  description: string;
  useQr: boolean;
  type: string;
  autoApprove: boolean;
  registrationEnd: Date | null;
  codePrefix: string;
};

const fmt = (n: number | null | undefined) => (n ? n.toLocaleString("id-ID") : "");
const day = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// Buat / ubah event dalam 6 bagian: jenis & template, informasi, jadwal, harga, pengaturan pendaftaran, kehadiran.
// Template kegiatan (hanya saat membuat) mengisi formulir, rundown, dan awalan nomor peserta; semuanya bisa diubah nanti.
export function EventForm({ action, categories, event }: { action: Action; categories: string[]; event?: EventValues }) {
  const drawer = useDrawer();
  const [message, formAction, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await action(prev, f);
    if (result === "Tersimpan.") drawer?.close(); // berhasil diubah: tutup panel
    return result;
  }, null);
  const creating = !event;
  const [type, setType] = useState<EventType>(event && isEventType(event.type) ? event.type : "event");
  const [activity, setActivity] = useState<ActivityKey>("umum");
  const [price, setPrice] = useState(fmt(event?.price));
  const [discount, setDiscount] = useState(fmt(event?.discount));
  const [quota, setQuota] = useState(fmt(event?.quota));
  const [approval, setApproval] = useState<"manual" | "auto">(event?.autoApprove ? "auto" : "manual");
  const [useCode, setUseCode] = useState(Boolean(event?.codePrefix) || creating);
  const [prefix, setPrefix] = useState(event?.codePrefix || ACTIVITIES.umum.prefix);
  const toNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const final = finalPrice({ price: toNum(price), discount: toNum(discount) });
  const course = type === "course";
  const tpl = ACTIVITIES[activity];
  const hasShuttle = tpl.fields.some((f) => f.id === SHUTTLE_FIELD_ID);
  const pick = (a: ActivityKey) => {
    setActivity(a);
    if (creating) {
      setPrefix(ACTIVITIES[a].prefix);
      setUseCode(Boolean(ACTIVITIES[a].prefix));
    }
  };

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <Section no={1} title="Jenis & template kegiatan" hint="Menentukan alur peserta dan isian awal formulir.">
        <ChoiceCards name="type" value={type} onChange={setType} options={(Object.keys(EVENT_TYPES) as EventType[]).map((v) => ({ value: v, ...EVENT_TYPES[v] }))} />
        {creating && !course && (
          <div>
            <p className="label">Template kegiatan</p>
            <ChoiceCards name="activity" value={activity} onChange={pick} cols={3} options={(Object.keys(ACTIVITIES) as ActivityKey[]).map((v) => ({ value: v, label: ACTIVITIES[v].label, hint: ACTIVITIES[v].hint }))} />
            {tpl.fields.length > 0 && (
              <p className="mt-2 text-xs text-gray-600">
                Isian formulir: {tpl.fields.map((f) => f.label.replace(/^Saya menyatakan.*/, "Pernyataan")).join(" · ")}.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section no={2} title="Informasi" hint="Tampil di halaman event dan hasil pencarian Google.">
        <div>
          <label className="label" htmlFor="name">Nama event / acara</label>
          <input id="name" name="name" className="input" defaultValue={event?.name} placeholder="contoh: Semarang Fun Ride 2026" required />
        </div>
        <CategoryPicker categories={categories} defaultValue={event?.category ?? ""} />
        <div>
          <label className="label" htmlFor="description">Deskripsi</label>
          <textarea id="description" name="description" rows={5} className="input" defaultValue={event?.description} placeholder={"Tujuan kegiatan, siapa yang cocok ikut, fasilitas yang didapat, dan syarat peserta.\nPisahkan paragraf dengan baris kosong."} />
        </div>
        <EventPhotosUpload coverUrl={event?.coverUrl} gallery={event?.gallery} />
      </Section>

      <Section no={3} title="Jadwal & lokasi">
        {course ? (
          <input type="hidden" name="mode" value="online" />
        ) : (
          <div>
            <label className="label" htmlFor="mode">Pelaksanaan</label>
            <select id="mode" name="mode" defaultValue={event?.mode ?? "offline"} className="input">
              <option value="offline">Offline (tatap muka)</option>
              <option value="online">Online (Zoom / live)</option>
              <option value="hybrid">Hybrid (offline + online)</option>
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="location">{course ? "Penyelenggara / platform" : "Lokasi"}</label>
          <input id="location" name="location" className="input" defaultValue={event?.location ?? (course ? "Online (video)" : "")} key={course ? "c" : "e"} placeholder="contoh: Simpang Lima, Semarang" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="startDate">{course ? "Dibuka mulai" : "Mulai"}</label>
            <input id="startDate" name="startDate" type="date" className="input" defaultValue={day(event?.startDate)} required />
          </div>
          <div>
            <label className="label" htmlFor="endDate">{course ? "Ditutup" : "Selesai"}</label>
            <input id="endDate" name="endDate" type="date" className="input" defaultValue={day(event?.endDate)} required />
          </div>
        </div>
      </Section>

      <Section no={4} title="Harga & kuota">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="price">Harga normal (Rp, kosong = gratis)</label>
            <NumInput id="price" value={price} onChange={setPrice} placeholder="contoh: 2.500.000" />
          </div>
          <div>
            <label className="label" htmlFor="discount">Diskon (%)</label>
            <NumInput id="discount" value={discount} onChange={setDiscount} placeholder="0" max={100} />
          </div>
        </div>
        {/* Pratinjau persis seperti di halaman pelatihan: harga coret + harga setelah diskon */}
        <div className="flex flex-wrap items-baseline gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
          <span className="text-gray-600">Harga tampil:</span>
          {!final ? (
            <span className="font-semibold text-gray-900">Gratis</span>
          ) : (
            <>
              {toNum(discount) > 0 && <span className="text-gray-500 line-through">{fmtRp(toNum(price))}</span>}
              <span className="text-base font-bold text-gray-900">{fmtRp(final)}</span>
              {toNum(discount) > 0 && <span className="rounded border border-red-200 bg-red-50 px-1.5 text-xs font-semibold text-red-700">-{toNum(discount)}%</span>}
            </>
          )}
        </div>
        <div>
          <label className="label" htmlFor="quota">Kuota peserta (kosongkan jika tanpa batas)</label>
          <NumInput id="quota" value={quota} onChange={setQuota} placeholder="contoh: 1.500" />
        </div>
      </Section>

      <Section no={5} title="Pengaturan pendaftaran" hint="Aturan dasar yang berlaku untuk setiap pendaftar.">
        <ul className="space-y-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700">
          <li>✓ Peserta wajib masuk (Google atau email). Nama dan email diambil dari akun; No. WhatsApp selalu ditanyakan.</li>
          <li>✓ Pendaftaran bertahap: data diri → pilihan & paket → pembayaran{final > 0 ? " (bukti transfer wajib)" : ""}.</li>
          <li>✓ Isian formulir bisa ditambah/diubah setelah dibuat di bagian Formulir pendaftaran.</li>
        </ul>
        <div>
          <p className="label">Persetujuan pendaftar</p>
          <ChoiceCards
            name="approval"
            value={approval}
            onChange={setApproval}
            options={[
              { value: "manual", label: "Ditinjau panitia", hint: "Superadmin memeriksa data & pembayaran sebelum menyetujui. Disarankan untuk event berbayar." },
              { value: "auto", label: "Langsung disetujui", hint: "Pendaftar langsung mendapat tiket selama kuota masih ada. Cocok untuk event gratis." },
            ]}
          />
        </div>
        <div>
          <label className="label" htmlFor="registrationEnd">Batas akhir pendaftaran (opsional)</label>
          <input id="registrationEnd" name="registrationEnd" type="date" className="input" defaultValue={day(event?.registrationEnd)} />
          <p className="mt-1 text-xs text-gray-500">Berlaku sampai pukul 23.59 WIB. Kosongkan bila pendaftaran ditutup manual lewat status event.</p>
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input type="checkbox" name="useCode" checked={useCode} onChange={(e) => setUseCode(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
            <span>
              <span className="font-medium">Beri nomor peserta otomatis</span>
              <span className="block text-xs text-gray-600">Mis. nomor BIB lari/sepeda. Diberikan berurutan saat pendaftaran disetujui dan tampil di tiket peserta.</span>
            </span>
          </label>
          {useCode && (
            <div className="flex items-center gap-2 pl-6">
              <label className="text-sm text-gray-700" htmlFor="codePrefix">Awalan</label>
              <input id="codePrefix" name="codePrefix" className="input w-28 uppercase" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="RUN" required />
              <span className="text-sm text-gray-600">→ contoh <span className="font-mono font-semibold text-gray-900">{prefix || "RUN"}-001</span></span>
            </div>
          )}
        </div>
        {creating && !course && hasShuttle && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-900">
            Template ini memakai <strong>shuttle</strong>. Setelah event dibuat, tambahkan rute di bagian <strong>Shuttle</strong> halaman event: dari mana, ke mana, tanggal & jam berangkat, dan kapasitas kursi.
          </p>
        )}
      </Section>

      {course ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-900">
          Setelah dibuat, tambahkan video materi (1, 2, 3, ...) dan kuis di menu <strong>Materi, kuis &amp; sertifikat</strong>. Sertifikat terbit otomatis saat peserta menyelesaikan semua video dan lulus kuis.
        </p>
      ) : (
        <Section no={6} title="Kehadiran & rundown">
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" name="useQr" defaultChecked={event?.useQr ?? true} className="mt-0.5 h-4 w-4 accent-brand" />
            <span>
              <span className="block font-medium text-gray-900">Pakai QR code</span>
              <span className="block text-xs text-gray-600">Panitia memindai QR peserta di tiap pos. Matikan bila kehadiran ditandai manual oleh panitia.</span>
            </span>
          </label>
          {creating && tpl.rundown.length > 0 && (
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" name="useRundown" defaultChecked className="mt-0.5 h-4 w-4 accent-brand" />
              <span>
                <span className="block font-medium text-gray-900">Isi rundown dari template ({tpl.rundown.length} item)</span>
                <span className="block text-xs text-gray-600">{tpl.rundown.map((r) => r[0]).join(" → ")}. Jam, tempat, dan deskripsi bisa diubah nanti.</span>
              </span>
            </label>
          )}
          {creating && tpl.fields.length > 0 && (
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" name="useForm" defaultChecked className="mt-0.5 h-4 w-4 accent-brand" />
              <span>
                <span className="block font-medium text-gray-900">Isi formulir pendaftaran dari template ({tpl.fields.length} isian)</span>
                <span className="block text-xs text-gray-600">Tanpa centang, peserta hanya mengisi No. WhatsApp.</span>
              </span>
            </label>
          )}
        </Section>
      )}

      {message && <p className={`text-sm ${message === "Tersimpan." ? "text-green-700" : "text-red-700"}`}>{message}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Menyimpan..." : event ? "Simpan perubahan" : "Buat event"}
      </button>
    </form>
  );
}
