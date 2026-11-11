import { ShieldCheckIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { answersIn, answersMatching, healthAlerts, readDetails } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

const EMERGENCY_CONTACTS = [
  { role: "Tim Medis & First Aid Lapangan", name: "dr. Hendra / Posko Medis", phone: "+62 811 2345 6789", type: "medis" },
  { role: "Layanan Ambulans Gawat Darurat", name: "Unit Ambulans Reaksi Cepat", phone: "119", type: "ambulance" },
  { role: "Rumah Sakit Rujukan Terdekat", name: "IGD RSUP Kariadi / Telogorejo", phone: "(024) 8413476", type: "hospital" },
  { role: "Koordinator Keamanan & Panitia", name: "Bambang (Ketua Lapangan)", phone: "+62 812 9988 7766", type: "security" },
  { role: "Kepolisian Wilayah", name: "Polsek Setempat", phone: "110", type: "police" },
];

export default async function AdminDaruratPage() {
  const admin = await requireAdmin("scanner");

  // Ambil peserta event yang ditugaskan kepada panitia ini
  const registrations = await db.registration.findMany({
    where: {
      event: { admins: { some: { id: admin.id } } },
      status: "approved",
    },
    include: {
      user: true,
      event: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter peserta yang memiliki catatan kesehatan, alergi, atau penyakit
  const medicalAlerts = registrations
    .map((r) => {
      // Jawaban formulir yang judulnya menyangkut kesehatan/darurat dan alamat (juga data pendaftaran lama).
      const details = readDetails(r.details);
      const health = healthAlerts(details).filter((x) => x.type !== "file").map((x) => x.value).join(" · ");
      const contact = answersIn(details, "darurat").map((x) => x.value).join(" · ");
      return {
        id: r.id,
        user: r.user,
        eventName: r.event.name,
        health,
        healthNotes: [health, contact && !health.includes(contact) && `Kontak darurat: ${contact}`].filter(Boolean).join(" · "),
        address: answersMatching(details, /alamat|domisili/i),
      };
    })
    // Hanya peserta yang benar-benar punya catatan kesehatan (bukan "tidak ada" / "normal").
    .filter((item) => item.health && !/tidak ada riwayat/i.test(item.health));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-600 text-white">
          <ShieldCheckIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Pusat Bantuan & Kontak Darurat</h1>
          <p className="text-xs text-gray-600">
            Akses cepat panggilan darurat medis, keamanan acara, dan pemantauan riwayat kesehatan peserta.
          </p>
        </div>
      </div>

      {/* 1. Tombol Panggilan Darurat Lapangan */}
      <section className="card p-5 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900">Nomor Darurat & Tim Medis Resmi</h2>
          <p className="text-[11px] text-gray-500">Gunakan untuk koordinasi cepat jika terjadi insiden di pos rute kegiatan</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY_CONTACTS.map((c) => (
            <div
              key={c.role}
              className="rounded-md border border-gray-200 bg-gray-50/70 p-3.5 flex flex-col justify-between space-y-2.5"
            >
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-red-600 uppercase block">
                  {c.role}
                </span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{c.name}</p>
                <p className="text-xs text-gray-600 font-mono mt-1">{c.phone}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                <a
                  href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                  className="btn btn-danger btn-sm text-[11px] flex-1 text-center py-1"
                >
                  Panggil 📞
                </a>
                {c.phone.startsWith("+") && (
                  <a
                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm text-[11px] flex-1 text-center py-1"
                  >
                    WhatsApp 💬
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Daftar Peserta dengan Riwayat Kesehatan / Perhatian Khusus */}
      <section className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Perhatian Medis Peserta</h2>
            <p className="text-[11px] text-gray-500">
              Daftar peserta yang memiliki catatan riwayat kesehatan atau kontak darurat keluarga
            </p>
          </div>
          <span className="rounded bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
            {medicalAlerts.length} Perhatian Medis
          </span>
        </div>

        {medicalAlerts.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-500">
            Semua peserta terdata dalam kondisi normal / tanpa riwayat penyakit khusus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th>Nama Peserta</th>
                  <th>Kontak Peserta</th>
                  <th>Catatan Kesehatan & Kontak Darurat</th>
                  <th>Alamat Domisili</th>
                  <th className="text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody>
                {medicalAlerts.map((m) => (
                  <tr key={m.id} className="hover:bg-red-50/30">
                    <td className="font-bold text-gray-900">
                      {m.user.name}
                      <span className="block text-[10px] text-gray-400 font-normal">{m.eventName}</span>
                    </td>
                    <td>
                      <span className="block font-medium text-gray-800">{m.user.phone || "-"}</span>
                      <span className="block text-[11px] text-gray-500">{m.user.email}</span>
                    </td>
                    <td>
                      <div className="rounded border border-red-200 bg-red-50/70 p-2 text-[11px] text-red-900 leading-relaxed max-w-md">
                        {m.healthNotes}
                      </div>
                    </td>
                    <td className="text-gray-600 max-w-xs truncate text-[11px]">
                      {m.address || "-"}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {m.user.phone && (
                        <a
                          href={`tel:${m.user.phone.replace(/[^0-9+]/g, "")}`}
                          className="btn btn-secondary btn-sm text-[11px] py-1"
                        >
                          Hubungi Peserta
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
