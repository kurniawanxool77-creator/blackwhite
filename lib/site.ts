import { cache } from "react";
import { db } from "./db";

export type Site = {
  name: string;
  tagline: string;
  about: string;
  heroImage: string; // "" = tanpa foto
  aboutImage: string;
  loginImage: string; // foto sisi kanan halaman Masuk/Daftar; kosong = pakai foto hero
  services: { title: string; body: string; image?: string }[];
  steps: string[];
  contact: { email: string; phone: string; address: string };
  banks: string[]; // rekening pembayaran, satu per baris: "Bank | Nomor rekening | Atas nama"
};

export type BankAccount = { bank: string; number: string; holder: string };

// Rekening dari pengaturan Halaman depan; baris yang tidak lengkap dilewati.
export const parseBanks = (lines: string[]): BankAccount[] =>
  lines.flatMap((l) => {
    const [bank = "", number = "", holder = ""] = l.split("|").map((x) => x.trim());
    return bank && number ? [{ bank, number, holder }] : [];
  });

// Nilai awal company profile. Superadmin mengubahnya di /superadmin/site (disimpan di tabel Setting).
export const DEFAULT_SITE: Site = {
  name: "L-Event",
  tagline: "Pelatihan bersertifikat dengan pendaftaran online dan absensi QR",
  about:
    "Kami membantu penyelenggara event mengelola peserta secara tertib: pendaftaran, persetujuan, hingga pemindaian QR di setiap titik acara seperti bandara, hotel, konsumsi, dan pengambilan barang.",
  heroImage: "",
  aboutImage: "",
  loginImage: "",
  services: [
    { title: "Pendaftaran & persetujuan", body: "Peserta mendaftar dengan akun Google, panitia menyetujui dari satu dasbor." },
    { title: "QR per checkpoint", body: "Satu QR per peserta dipindai di setiap titik acara, berurutan sesuai jadwal." },
    { title: "Laporan langsung", body: "Lihat siapa yang sudah dan belum hadir di tiap checkpoint, lalu ekspor ke CSV." },
  ],
  steps: [
    "Buat akun atau masuk dengan Google, lalu daftar pelatihan",
    "Tunggu persetujuan panitia",
    "Tunjukkan QR di setiap checkpoint",
    "Pantau progres Anda di dasbor",
  ],
  contact: { email: "info@contoh.co.id", phone: "+62 812 0000 0000", address: "Jakarta, Indonesia" },
  banks: ["Bank Mandiri | 137-00-1928374-1 | Panitia Penyelenggara", "BCA | 088-349-2810 | Panitia Penyelenggara"],
};

export const getSite = cache(async (): Promise<Site> => {
  const row = await db.setting.findUnique({ where: { key: "site" } });
  return row ? { ...DEFAULT_SITE, ...JSON.parse(row.value) } : DEFAULT_SITE;
});
