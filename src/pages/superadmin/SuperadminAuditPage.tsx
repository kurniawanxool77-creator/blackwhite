import type { AuditLog } from "@prisma/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateTime } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function SuperadminAuditPage() {
  const state = useApiData<{ logs: AuditLog[] }>("/api/superadmin/audit");

  return (
    <DataGate state={state}>
      {({ logs }) => (
        <div className="space-y-5">
          <PageHeader title="Riwayat aktivitas admin" description="Catatan perubahan data dan tindakan petugas terbaru." />
          <section className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Admin</th>
                    <th>Aksi</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-gray-500">Belum ada catatan aktivitas.</td></tr>
                  )}
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap text-xs text-gray-500">{fmtDateTime(l.createdAt)}</td>
                      <td className="font-medium text-gray-900">{l.adminName}</td>
                      <td>{l.action}</td>
                      <td className="text-xs text-gray-600">{l.detail || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DataGate>
  );
}

