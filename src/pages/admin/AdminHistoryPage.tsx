import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateTime } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { undoScan } from "@/src/lib/actions/admin";
import { useApiData } from "@/src/lib/api-client";

type ScanHistoryRow = {
  id: string;
  createdAt: Date;
  canUndo: boolean;
  admin: { name: string };
  registration: { id: string; code: string | null; eventId: string; user: { name: string } };
  checkpoint: { name: string; event: { id: string; name: string } };
};

export function AdminHistoryPage() {
  const [searchParams] = useSearchParams();
  const mine = searchParams.get("oleh") === "saya";
  const state = useApiData<{ scans: ScanHistoryRow[] }>(mine ? "/api/admin/riwayat?oleh=saya" : "/api/admin/riwayat");

  async function handleUndo(scanId: string, name: string) {
    if (!window.confirm(`Batalkan scan untuk ${name}?`)) return;
    await undoScan(scanId);
  }

  return (
    <DataGate state={state}>
      {({ scans }) => (
        <div className="space-y-5">
          <PageHeader title="Riwayat scan QR" description="Daftar pemindaian QR peserta terbaru di event Anda.">
            <div className="flex gap-1.5 text-xs">
              <Link to="/admin/riwayat" className={`rounded px-3 py-1.5 font-medium ${!mine ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
                Semua panitia
              </Link>
              <Link to="/admin/riwayat?oleh=saya" className={`rounded px-3 py-1.5 font-medium ${mine ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
                Scan saya
              </Link>
            </div>
          </PageHeader>

          {scans.length === 0 ? (
            <div className="card p-6 text-sm text-gray-600">Belum ada riwayat scan.</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Peserta</th>
                    <th>Pos & event</th>
                    <th>Petugas</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s) => (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap text-xs text-gray-600">{fmtDateTime(s.createdAt)}</td>
                      <td>
                        <Link to={`/admin/events/${s.checkpoint.event.id}/peserta/${s.registration.id}`} className="font-medium text-gray-900 hover:text-brand">
                          {s.registration.user.name}
                        </Link>
                        {s.registration.code && <p className="font-mono text-xs text-gray-500">{s.registration.code}</p>}
                      </td>
                      <td>
                        <p className="font-medium text-gray-800">{s.checkpoint.name}</p>
                        <p className="text-xs text-gray-500">{s.checkpoint.event.name}</p>
                      </td>
                      <td className="text-xs text-gray-600">{s.admin.name}</td>
                      <td className="text-right">
                        {s.canUndo && (
                          <button type="button" onClick={() => handleUndo(s.id, s.registration.user.name)} className="btn btn-danger btn-sm text-xs">
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DataGate>
  );
}

