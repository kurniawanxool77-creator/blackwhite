import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAdmin("superadmin");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Riwayat tindakan</h1>
      <p className="mt-1 text-sm text-gray-600">200 tindakan terakhir Superadmin dan panitia (check-in manual, pembatalan scan): siapa mengubah apa dan kapan.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Admin</th>
              <th>Tindakan</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500">Belum ada tindakan tercatat.</td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                <td>{l.adminName}</td>
                <td className="font-medium text-gray-900">{l.action}</td>
                <td className="text-gray-600">{l.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
