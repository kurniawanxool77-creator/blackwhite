import type { FieldGroup, FieldType, FormField } from "./registration-form";

// Jenis event menentukan alur peserta:
// - "event": tatap muka/hybrid — formulir lengkap, rundown, QR di tiap pos.
// - "course": pelatihan video — video 1, 2, 3, ... dibuka berurutan, kuis, lalu sertifikat. Tanpa QR.
export const EVENT_TYPES = {
  event: { label: "Event / pelatihan tatap muka", hint: "Peserta datang ke lokasi. Ada formulir pendaftaran, rundown, dan kehadiran lewat QR di tiap pos." },
  course: { label: "Pelatihan video (online)", hint: "Peserta menonton video materi berurutan sampai selesai, mengerjakan kuis, lalu mendapat sertifikat." },
} as const;

export type EventType = keyof typeof EVENT_TYPES;
export const isEventType = (v: unknown): v is EventType => typeof v === "string" && v in EVENT_TYPES;

const F = (id: string, label: string, type: FieldType, group: FieldGroup, required: boolean, options: string[] = [], hint = ""): FormField => ({ id, label, type, group, required, options, hint });

// Blok isian yang dipakai beberapa template. id tetap agar rute shuttle bisa diisi otomatis.
export const SHUTTLE_FIELD_ID = "shtl0001";
const BAJU = [
  F("jkaos001", "Kategori baju / jersey", "radio", "umum", true, ["Pria", "Wanita"]),
  F("ukaos001", "Ukuran baju / jersey", "select", "umum", true, ["XS", "S", "M", "L", "XL", "XXL", "3XL"], "Lihat tabel ukuran sesuai kategori Pria atau Wanita."),
];
// Rute shuttle (dari, ke, jadwal, kapasitas) diatur di halaman event; peserta memilih salah satu atau "tidak memakai shuttle".
const SHUTTLE = [
  F(SHUTTLE_FIELD_ID, "Shuttle", "shuttle", "umum", true, [], "Pilih rute dan jadwal keberangkatan, atau tidak menggunakan shuttle."),
  F("shtl0002", "Detail kedatangan", "text", "umum", false, [], "No. penerbangan/kereta dan jam tiba, mis. GA-234 tiba 09.40"),
];
const INAP = [F("inap0001", "Penginapan", "select", "umum", true, ["Tanpa penginapan", "Hotel – kamar berdua (twin share)", "Hotel – kamar sendiri (single)"])];
const DARURAT = [
  F("drtnama1", "Nama kontak darurat", "text", "darurat", true),
  F("drtnomr1", "Nomor kontak darurat", "tel", "darurat", true),
  F("drthub01", "Hubungan dengan kontak darurat", "text", "darurat", true, [], "Contoh: orang tua, pasangan, teman"),
];
const SEHAT = [
  F("goldar01", "Golongan darah", "select", "kesehatan", true, ["A", "B", "AB", "O", "Tidak tahu"]),
  F("sehat001", "Riwayat penyakit / alergi", "textarea", "kesehatan", false, [], "Kosongkan bila tidak ada"),
];
const INSTANSI = [F("instansi1", "Instansi / perusahaan", "text", "umum", false), F("jabatan01", "Jabatan", "text", "umum", false)];
const SETUJU = [F("setuju01", "Saya menyatakan data yang diisi benar dan bersedia mematuhi aturan panitia", "checkbox", "umum", true)];

// Item rundown awal: [nama, jenis, perlu scan, hari ke (0 = hari pertama event, -1 = H-1), jam mulai, jam selesai, tempat, deskripsi].
export type RundownSeed = [string, "attendance" | "meal" | "item" | "storage", boolean, number, string, string, string, string];

export type Activity = { label: string; hint: string; prefix: string; fields: FormField[]; rundown: RundownSeed[] };

// Template kegiatan tatap muka: formulir, rundown, dan awalan nomor peserta yang cocok. Semua bisa diubah setelah dibuat.
export const ACTIVITIES = {
  umum: {
    label: "Pelatihan / workshop",
    hint: "Instansi, jabatan, ukuran baju, kontak darurat.",
    prefix: "PST",
    fields: [...INSTANSI, ...BAJU, ...DARURAT.slice(0, 2), SEHAT[1], ...SETUJU],
    rundown: [
      ["Registrasi ulang", "attendance", true, 0, "07.30", "08.00", "Meja registrasi", "Tunjukkan QR; peserta menerima kit dan tanda pengenal."],
      ["Sesi materi 1", "attendance", false, 0, "08.00", "12.00", "Ruang utama", ""],
      ["Makan siang", "meal", true, 0, "12.00", "13.00", "Restoran", "Tunjukkan QR di pintu restoran."],
      ["Sesi materi 2", "attendance", false, 0, "13.00", "16.00", "Ruang utama", ""],
      ["Penutupan & foto bersama", "attendance", false, 0, "16.00", "16.30", "Ruang utama", ""],
    ],
  },
  seminar: {
    label: "Seminar",
    hint: "Instansi dan jabatan saja; pendaftaran cepat.",
    prefix: "SMN",
    fields: [...INSTANSI, ...SETUJU],
    rundown: [
      ["Registrasi", "attendance", true, 0, "08.00", "08.30", "Lobi", "Tunjukkan QR di meja registrasi."],
      ["Pembukaan", "attendance", false, 0, "08.30", "09.00", "Ruang seminar", ""],
      ["Sesi pemaparan", "attendance", false, 0, "09.00", "11.30", "Ruang seminar", ""],
      ["Tanya jawab & penutupan", "attendance", false, 0, "11.30", "12.00", "Ruang seminar", ""],
    ],
  },
  lari: {
    label: "Event lari",
    hint: "Kategori jarak, jersey, golongan darah, kontak darurat, shuttle, penginapan. Nomor BIB otomatis.",
    prefix: "RUN",
    fields: [F("jarak001", "Kategori jarak", "radio", "umum", true, ["5K", "10K", "Half marathon (21K)"]), ...BAJU, ...SEHAT, ...DARURAT, ...SHUTTLE, ...INAP, ...SETUJU],
    rundown: [
      ["Pengambilan race pack", "item", true, -1, "10.00", "20.00", "Booth race pack", "Tunjukkan QR dan KTP. Race pack berisi nomor BIB, jersey, dan chip waktu."],
      ["Check-in area start", "attendance", true, 0, "04.30", "05.30", "Gerbang start", "Peserta masuk area start sesuai kategori jarak."],
      ["Start", "attendance", false, 0, "05.45", "", "Garis start", ""],
      ["Finish & pengambilan medali", "item", true, 0, "06.30", "10.00", "Area finish", "Tunjukkan QR/BIB untuk mengambil medali dan refreshment."],
    ],
  },
  sepeda: {
    label: "Event sepeda",
    hint: "Kategori, merek, warna, ciri-ciri & foto sepeda, jersey, kontak darurat, shuttle, penginapan. Nomor peserta otomatis.",
    prefix: "BIKE",
    fields: [
      F("ktsepeda", "Kategori sepeda", "radio", "barang", true, ["Road bike", "MTB", "Gravel", "Sepeda lipat"]),
      F("mrsepeda", "Merek & tipe sepeda", "text", "barang", true, [], "Contoh: Polygon Strattos S3"),
      F("wrsepeda", "Warna sepeda", "text", "barang", true, [], "Contoh: hitam-merah"),
      F("crsepeda", "Ciri-ciri sepeda", "textarea", "barang", true, [], "Stang, sadel, stiker, aksesori, atau tanda unik agar mudah dikenali panitia"),
      F("ftsepeda", "Foto sepeda", "file", "barang", true, [], "Foto seluruh sepeda dari samping, jelas dan terang"),
      ...BAJU,
      ...SEHAT,
      ...DARURAT,
      ...SHUTTLE,
      ...INAP,
      ...SETUJU,
    ],
    rundown: [
      ["Pengambilan race pack", "item", true, -1, "10.00", "20.00", "Booth race pack", "Tunjukkan QR dan KTP. Race pack berisi nomor peserta dan jersey."],
      ["Pemeriksaan sepeda", "attendance", true, 0, "05.00", "06.00", "Area start", "Panitia mencocokkan sepeda dengan foto dan ciri-ciri di formulir pendaftaran."],
      ["Start", "attendance", false, 0, "06.15", "", "Garis start", ""],
      ["Pos 1", "attendance", true, 0, "07.30", "09.00", "Pos 1 rute", "Scan di setiap pos untuk memastikan peserta melewati rute."],
      ["Finish & makan siang", "meal", true, 0, "10.00", "13.00", "Area finish", ""],
    ],
  },
  kosong: { label: "Kosong (susun sendiri)", hint: "Tanpa isian dan rundown awal.", prefix: "", fields: [], rundown: [] },
} satisfies Record<string, Activity>;

export type ActivityKey = keyof typeof ACTIVITIES;
export const isActivity = (v: unknown): v is ActivityKey => typeof v === "string" && v in ACTIVITIES;

// Formulir event umum untuk tombol "Pakai formulir event" di penyusun formulir.
export const EVENT_FORM_TEMPLATE: FormField[] = [...BAJU, ...SHUTTLE, ...INAP, ...DARURAT.slice(0, 2), SEHAT[1], ...SETUJU];

// Tombol "tambah cepat" di penyusun formulir. id baru dibuat saat ditambahkan.
export const FIELD_PRESETS: { label: string; fields: Omit<FormField, "id">[] }[] = [
  { label: "Baju Pria/Wanita + ukuran", fields: BAJU },
  { label: "Shuttle (rute event)", fields: SHUTTLE },
  { label: "Penginapan", fields: INAP },
  { label: "Paket + harga", fields: [F("x", "Pilih paket", "package", "umum", true, ["Reguler | 500.000 | Hanya pelatihan", "Paket Lengkap | 1.500.000 | Termasuk penginapan & shuttle"])] },
  { label: "Kontak darurat", fields: DARURAT },
  { label: "Kesehatan", fields: SEHAT },
  { label: "Sepeda (ciri + foto)", fields: ACTIVITIES.sepeda.fields.slice(0, 5) },
  { label: "Barang bawaan", fields: [F("x", "Barang yang dibawa", "textarea", "barang", false, [], "Jenis, merek, warna, ciri khusus"), F("x", "Foto barang bawaan", "file", "barang", false)] },
  { label: "Foto KTP", fields: [F("x", "Foto identitas (KTP)", "file", "umum", true, [], "JPG, PNG, atau WebP, maks. 4 MB")] },
  { label: "Pernyataan", fields: SETUJU },
];
