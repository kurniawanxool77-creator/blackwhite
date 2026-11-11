// Pembaca field FormData untuk server action.
export const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();

export const digits = (f: FormData, key: string) => Number(str(f, key).replace(/\D/g, "")) || 0;

// Hasil form yang menampilkan pesan sukses atau gagal (useActionState).
export type FormState = { ok: boolean; message: string } | null;

// No. HP: angka, boleh diawali + dan dipisah spasi atau strip, 8–20 karakter.
export const PHONE_RE = /^\+?[\d\s-]{8,20}$/;
