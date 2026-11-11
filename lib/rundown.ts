import { hasOptions, parsePackage, type FormField, type RegDetails } from "./registration-form";

// Item rundown bisa khusus untuk peserta dengan jawaban tertentu, mis. paket "Paket Lengkap" atau
// "Antar-jemput: Ya". Checkpoint.audience = JSON daftar "idIsian:nilai"; kosong = semua peserta.

export const audienceKey = (fieldId: string, value: string) => `${fieldId}:${value}`;

export function parseAudience(json: string | null | undefined): string[] {
  try {
    const a = JSON.parse(json || "[]");
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Apakah item rundown ini berlaku untuk peserta dengan jawaban formulir tersebut.
export function appliesTo(cp: { audience: string }, d: RegDetails) {
  const audience = parseAudience(cp.audience);
  return audience.length === 0 || d.answers.some((a) => audience.includes(audienceKey(a.id, a.value)));
}

// Semua pilihan di formulir (dropdown, tombol, paket) yang bisa dijadikan syarat item rundown.
export function choiceOptions(fields: FormField[]) {
  return fields
    .filter((f) => hasOptions(f.type))
    .flatMap((f) =>
      f.options.map((o) => {
        const value = f.type === "package" ? parsePackage(o).name : o;
        return { key: audienceKey(f.id, value), field: f.label, value };
      }),
    );
}

// Label singkat, mis. "Paket Lengkap / Reguler"; null bila untuk semua peserta.
export function audienceLabel(cp: { audience: string }) {
  const audience = parseAudience(cp.audience);
  return audience.length ? audience.map((k) => k.slice(k.indexOf(":") + 1)).join(" / ") : null;
}
