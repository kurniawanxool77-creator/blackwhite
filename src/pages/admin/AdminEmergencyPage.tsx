import { PageHeader } from "@/components/admin/PageHeader";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type EmergencyPayload = {
  contacts: { role: string; name: string; phone: string; type: string }[];
  medicalAlerts: {
    id: string;
    user: { id: string; name: string; email: string; phone: string | null };
    eventName: string;
    health: string;
    healthNotes: string;
    address: string;
  }[];
};

export function AdminEmergencyPage() {
  const state = useApiData<EmergencyPayload>("/api/admin/darurat");

  return (
    <DataGate state={state}>
      {({ contacts, medicalAlerts }) => (
        <div className="space-y-6">
          <PageHeader title="Pusat Bantuan & Darurat" description="Kontak penting lapangan dan daftar peserta dengan perhatian medis khusus." />

          <section className="card space-y-3 p-5">
            <h2 className="text-sm font-bold text-gray-900">Kontak Darurat Lapangan</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((c) => {
                const tel = c.phone.replace(/[^0-9+]/g, "");
                return (
                  <div key={c.role} className="flex flex-col justify-between rounded-md border border-gray-200 p-4">
                    <div>
                      <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{c.type}</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">{c.role}</p>
                      <p className="mt-0.5 text-xs text-gray-600">{c.name}</p>
                    </div>
                    {tel && (
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                        <span className="font-mono text-xs font-semibold text-gray-800">{c.phone}</span>
                        <a href={`tel:${tel}`} className="btn btn-secondary btn-sm py-1 text-xs">Telepon</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Perhatian Medis Peserta</h2>
                <p className="text-[11px] text-gray-500">Daftar peserta yang memiliki catatan riwayat kesehatan atau kontak darurat keluarga</p>
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
                          <span className="block font-normal text-[10px] text-gray-400">{m.eventName}</span>
                        </td>
                        <td>
                          <span className="block font-medium text-gray-800">{m.user.phone || "-"}</span>
                          <span className="block text-[11px] text-gray-500">{m.user.email}</span>
                        </td>
                        <td>
                          <div className="max-w-md rounded border border-red-200 bg-red-50/70 p-2 text-[11px] leading-relaxed text-red-900">
                            {m.healthNotes}
                          </div>
                        </td>
                        <td className="max-w-xs truncate text-[11px] text-gray-600">{m.address || "-"}</td>
                        <td className="text-right whitespace-nowrap">
                          {m.user.phone && (
                            <a href={`tel:${m.user.phone.replace(/[^0-9+]/g, "")}`} className="btn btn-secondary btn-sm py-1 text-[11px]">
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
      )}
    </DataGate>
  );
}

