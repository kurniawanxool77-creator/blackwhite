export type Site = {
  name: string;
  tagline: string;
  about: string;
  heroImage: string;
  aboutImage: string;
  loginImage: string;
  logoImage?: string;
  services: { title: string; body: string; image?: string }[];
  steps: string[];
  contact: { email: string; phone: string; address: string };
  banks: string[];
};

export type BankAccount = { bank: string; number: string; holder: string };

export const splitBankLine = (line: string): BankAccount => {
  const [bank = "", number = "", holder = ""] = line.split("|").map((x) => x.replace(/\|/g, " ").trim());
  return { bank, number, holder };
};

export const formatBankLine = ({ bank, number, holder }: BankAccount): string => {
  const clean = (v: string) => v.replace(/\|/g, " ").trim();
  const [b, n, h] = [clean(bank), clean(number), clean(holder)];
  if (!b && !n && !h) return "";
  return h ? `${b} | ${n} | ${h}` : `${b} | ${n}`;
};

export const parseBanks = (lines: string[]): BankAccount[] =>
  lines.map(splitBankLine).filter((b) => Boolean(b.bank && b.number));

export const DEFAULT_SITE: Site = {
  name: "BlackWhite Event",
  tagline: "Platform pendaftaran event online, e-tiket barcode QR, dan absensi kegiatan",
  about:
    "BlackWhite Event membantu penyelenggara mengelola kegiatan secara profesional: pendaftaran peserta, pembayaran tiket online, persetujuan panitia, hingga pemindaian barcode QR di setiap pos acara seperti registrasi ulang, konsumsi, dan pengambilan fasilitas.",
  heroImage: "",
  aboutImage: "",
  loginImage: "",
  logoImage: "/logo.png",
  services: [
    { title: "Pendaftaran & Tiket Barcode", body: "Peserta mendaftar mandiri atau via Google, tiket QR resmi diterbitkan instan dan aman." },
    { title: "Scan QR Checkpoint Cepat", body: "Satu barcode QR per peserta dipindai di tiap pos titik acara secara akurat dan anti-duplikasi." },
    { title: "Laporan & Absensi Real-Time", body: "Pantau kehadiran peserta secara langsung di setiap sesi acara dan ekspor rekapitulasi data lengkap." },
  ],
  steps: [
    "Buat akun atau masuk dengan Google, lalu daftar event",
    "Tunggu persetujuan panitia",
    "Tunjukkan QR di setiap checkpoint",
    "Pantau progres Anda di dasbor",
  ],
  contact: { email: "admin@blackwhite.co.id", phone: "+62 821-5615-7217", address: "Jakarta, Indonesia" },
  banks: ["Bank Mandiri | 137-00-1928374-1 | Panitia Penyelenggara", "BCA | 088-349-2810 | Panitia Penyelenggara"],
};

