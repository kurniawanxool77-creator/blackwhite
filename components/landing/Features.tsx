import { CheckCircleIcon, QrCodeIcon, ShieldCheckIcon, ClockIcon } from "@/components/ui/icons";

const FEATURES = [
  {
    icon: QrCodeIcon,
    title: "Satu QR untuk Semua Pos",
    desc: "Setiap peserta mendapatkan satu kode QR resmi untuk seluruh rangkaian acara, mulai dari registrasi ulang hingga kepulangan.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Proteksi Anti-Duplikasi",
    desc: "Sistem mengunci tiket ganda atau scan berulang secara instan dengan proteksi integritas level database.",
  },
  {
    icon: ClockIcon,
    title: "Verifikasi Cepat & Real-Time",
    desc: "Pemindaian kamera berkecepatan tinggi tanpa hambatan antrean. Riwayat kehadiran langsung diperbarui otomatis.",
  },
  {
    icon: CheckCircleIcon,
    title: "Monitoring & Tracking Mandiri",
    desc: "Peserta dapat memantau setiap progres checkpoint yang telah dilewati langsung dari perangkat ponsel mereka.",
  },
];

export function Features() {
  return (
    <section className="border-b border-gray-200 bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-brand uppercase">Keunggulan Sistem</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Solusi Presensi & Verifikasi Terstandar Enterprise
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Dirancang untuk menjamin ketertiban dan akurasi data kehadiran peserta di setiap titik kegiatan.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="card flex flex-col p-5 transition duration-200 hover:border-gray-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
