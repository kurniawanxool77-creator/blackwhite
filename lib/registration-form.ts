import { PHONE_RE } from "./form";
import { NO_SHUTTLE, NO_SHUTTLE_LABEL } from "./schedule";

// Formulir pendaftaran yang disusun Superadmin per pelatihan (Event.formFields, JSON).
// Jawaban peserta disimpan di Registration.details sebagai { answers: Answer[], total, paymentProof }
// beserta salinan judul isian, agar tetap terbaca walau formulir diubah setelah peserta mendaftar.

export const FIELD_TYPES = {
  text: "Teks singkat",
  textarea: "Teks panjang",
  number: "Angka",
  date: "Tanggal",
  email: "Email",
  tel: "No. HP / WhatsApp",
  select: "Pilihan (dropdown)",
  radio: "Pilihan (tombol)",
  package: "Paket + harga",
  file: "Foto / gambar",
  shuttle: "Shuttle (rute dari halaman event)",
  checkbox: "Centang persetujuan",
} as const;

// Kelompok isian: menentukan di bagian mana jawaban tampil (detail peserta, badge, halaman Darurat).
export const FIELD_GROUPS = {
  umum: "Data umum",
  kesehatan: "Kesehatan",
  barang: "Barang bawaan",
  darurat: "Kontak darurat",
} as const;

export type FieldType = keyof typeof FIELD_TYPES;
export type FieldGroup = keyof typeof FIELD_GROUPS;
export type FormField = { id: string; label: string; type: FieldType; group: FieldGroup; required: boolean; options: string[]; hint: string };
export type Answer = { id: string; label: string; type: FieldType; group?: FieldGroup; value: string };
export type PackageOption = { name: string; price: number; note: string };

const MAX_FIELDS = 40;
const MAX_OPTIONS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEDIA_RE = /^\/media\/[a-z0-9]+$/i;

export const hasOptions = (t: FieldType) => t === "select" || t === "radio" || t === "package";
export const newFieldId = () => Math.random().toString(36).slice(2, 10);

// Baris paket: "Nama | harga | keterangan", contoh "Paket Lengkap | 1.750.000 | Hotel 2 malam".
export function parsePackage(line: string): PackageOption {
  const [name = "", price = "", note = ""] = line.split("|").map((s) => s.trim());
  return { name, price: Number(price.replace(/\D/g, "")) || 0, note };
}

// Membersihkan isian dari Superadmin (atau dari database): tipe dikenal, teks dipotong, pilihan kosong dibuang.
export function cleanFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, MAX_FIELDS).flatMap((r): FormField[] => {
    const type = String(r?.type ?? "") as FieldType;
    const label = String(r?.label ?? "").trim().slice(0, 160);
    if (!label || !(type in FIELD_TYPES)) return [];
    let id = String(r?.id ?? "");
    if (!/^[a-z0-9]{4,20}$/.test(id) || seen.has(id)) id = newFieldId();
    seen.add(id);
    const options = hasOptions(type)
      ? (Array.isArray(r?.options) ? r.options : []).map((o: unknown) => String(o).trim().slice(0, 200)).filter(Boolean).slice(0, MAX_OPTIONS)
      : [];
    if (hasOptions(type) && options.length === 0) return [];
    const group: FieldGroup = String(r?.group) in FIELD_GROUPS ? (String(r.group) as FieldGroup) : "umum";
    return [{ id, label, type, group, required: Boolean(r?.required), options, hint: String(r?.hint ?? "").trim().slice(0, 240) }];
  });
}

export function parseFields(json: string | null | undefined): FormField[] {
  try {
    return cleanFields(JSON.parse(json || "[]"));
  } catch {
    return [];
  }
}

const optionName = (f: FormField, o: string) => (f.type === "package" ? parsePackage(o).name : o);

// Membaca dan memvalidasi jawaban (input bernama f_<id>). Mengembalikan pesan error atau jawaban + harga paket.
// routes = rute shuttle event (isian tipe "shuttle" menyimpan id rute; jawabannya berupa label rute).
export function readAnswers(
  fields: FormField[],
  f: FormData,
  routes: { id: string; label: string }[] = [],
): string | { answers: Answer[]; packagePrice: number | null; shuttleId: string | null } {
  const answers: Answer[] = [];
  let packagePrice: number | null = null;
  let shuttleId: string | null = null;
  for (const field of fields) {
    let value = String(f.get(`f_${field.id}`) ?? "").trim().slice(0, 2000);
    if (field.type === "shuttle" && value) {
      const route = routes.find((r) => r.id === value);
      if (value !== NO_SHUTTLE && !route) return `${field.label}: rute tidak tersedia.`;
      shuttleId = route?.id ?? null;
      value = route?.label ?? NO_SHUTTLE_LABEL;
    }
    if (field.type === "checkbox") value = value ? "Ya" : "";
    if (!value) {
      if (field.required) return field.type === "checkbox" ? `Centang "${field.label}".` : `${field.label} wajib diisi.`;
      continue;
    }
    const bad =
      (field.type === "email" && !EMAIL_RE.test(value)) ||
      (field.type === "tel" && !PHONE_RE.test(value)) ||
      (field.type === "number" && !/^\d[\d.,]*$/.test(value)) ||
      (field.type === "date" && isNaN(+new Date(value))) ||
      (field.type === "file" && !MEDIA_RE.test(value)) ||
      (hasOptions(field.type) && !field.options.some((o) => optionName(field, o) === value));
    if (bad) return `${field.label} tidak valid.`;
    if (field.type === "package") packagePrice = parsePackage(field.options.find((o) => parsePackage(o).name === value)!).price;
    answers.push({ id: field.id, label: field.label, type: field.type, group: field.group, value });
  }
  return { answers, packagePrice, shuttleId };
}

export type RegDetails = { answers: Answer[]; total: number | null; paymentProof: string; paymentProofUrl: string };

// Pendaftaran lama menyimpan kunci tetap (hotel, shuttle, ...); tetap ditampilkan dengan judul yang sesuai.
const LEGACY: Record<string, string> = {
  hotel: "Hotel",
  shuttle: "Antar-jemput",
  shuttleTime: "Waktu & lokasi jemput",
  shirtSize: "Ukuran baju",
  eventDetail: "Perlengkapan",
  address: "Alamat",
  healthNotes: "Kesehatan & kontak darurat",
};

export function readDetails(json: string | null | undefined): RegDetails {
  let d: Record<string, unknown> = {};
  try {
    d = JSON.parse(json || "{}") ?? {};
  } catch {
    // data rusak: anggap kosong
  }
  const answers = Array.isArray(d.answers)
    ? (d.answers as Answer[]).filter((a) => a && a.label && a.value)
    : Object.entries(LEGACY).flatMap(([k, label]) => (typeof d[k] === "string" && d[k] ? [{ id: k, label, type: "text" as const, value: d[k] as string }] : []));
  return {
    answers,
    total: typeof d.total === "number" ? d.total : null,
    paymentProof: typeof d.paymentProof === "string" ? d.paymentProof : "",
    paymentProofUrl: typeof d.paymentProofUrl === "string" && /^\/media\/[a-z0-9]+$/i.test(d.paymentProofUrl) ? d.paymentProofUrl : "",
  };
}

// Gabungan jawaban yang judulnya cocok, mis. /alamat|domisili/.
export const answersMatching = (d: RegDetails, re: RegExp) =>
  d.answers.filter((a) => re.test(a.label) && a.type !== "file").map((a) => a.value).join(" · ");

// Jawaban tanpa kelompok (data lama) ditebak dari judulnya.
const GUESS: [FieldGroup, RegExp][] = [
  ["kesehatan", /kesehatan|alergi|penyakit|medis|obat/i],
  ["darurat", /darurat/i],
  ["barang", /barang|bawa|perlengkapan|alat|sepeda/i],
];
export const groupOf = (a: Answer): FieldGroup => a.group ?? GUESS.find(([, re]) => re.test(a.label))?.[0] ?? "umum";
export const answersIn = (d: RegDetails, group: FieldGroup) => d.answers.filter((a) => groupOf(a) === group);

// Jawaban kesehatan yang benar-benar berisi kondisi (bukan "tidak ada", "-", "normal").
const NONE = /^(-+|tidak( ada)?|tdk ada|normal|sehat|nihil|aman)$/i;
export const healthAlerts = (d: RegDetails) => answersIn(d, "kesehatan").filter((a) => a.type !== "checkbox" && (a.type === "file" || !NONE.test(a.value)));
export const itemAnswers = (d: RegDetails) => answersIn(d, "barang").filter((a) => a.type === "file" || !NONE.test(a.value));

// Contoh formulir lengkap yang bisa langsung dipakai lalu diubah.
export const SAMPLE_FIELDS: Omit<FormField, "id">[] = [
  { label: "Tanggal lahir", type: "date", group: "umum", required: true, options: [], hint: "" },
  { label: "Kota domisili", type: "text", group: "umum", required: true, options: [], hint: "" },
  { label: "Instansi / komunitas", type: "text", group: "umum", required: false, options: [], hint: "" },
  { label: "Pilih paket", type: "package", group: "umum", required: true, options: ["Early Bird | 500.000 | Berlaku sampai akhir bulan", "Reguler | 550.000 | Hanya pelatihan", "Paket Lengkap | 1.750.000 | Pelatihan + hotel 2 malam + transportasi"], hint: "" },
  { label: "Ukuran kaos", type: "select", group: "umum", required: true, options: ["S", "M", "L", "XL", "XXL"], hint: "" },
  { label: "Barang yang dibawa", type: "textarea", group: "barang", required: false, options: [], hint: "Sebutkan jenis, merek, warna, atau ciri khusus" },
  { label: "Foto barang bawaan", type: "file", group: "barang", required: false, options: [], hint: "Agar panitia mudah mengenali barang Anda" },
  { label: "Riwayat penyakit / alergi", type: "textarea", group: "kesehatan", required: false, options: [], hint: "Kosongkan bila tidak ada" },
  { label: "Obat yang rutin diminum", type: "text", group: "kesehatan", required: false, options: [], hint: "" },
  { label: "Nama kontak darurat", type: "text", group: "darurat", required: true, options: [], hint: "" },
  { label: "Nomor kontak darurat", type: "tel", group: "darurat", required: true, options: [], hint: "" },
  { label: "Hubungan dengan kontak darurat", type: "text", group: "darurat", required: true, options: [], hint: "Contoh: orang tua, pasangan, teman" },
  { label: "Foto identitas (KTP)", type: "file", group: "umum", required: false, options: [], hint: "JPG, PNG, atau WebP, maks. 4 MB" },
  { label: "Catatan tambahan", type: "textarea", group: "umum", required: false, options: [], hint: "" },
  { label: "Saya menyatakan data yang diisi benar dan bersedia mematuhi aturan panitia", type: "checkbox", group: "umum", required: true, options: [], hint: "" },
];
