import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { canUndoScan, UNDO_MINUTES } from "@/lib/checkin";
import { CHECKPOINT_KIND, fmtDateTime } from "@/lib/format";
import type { Participant } from "@/lib/participant";
import type { RegDetails } from "@/lib/registration-form";
import { appliesTo, audienceLabel } from "@/lib/rundown";
import { fmtWhen } from "@/lib/schedule";
import { manualCheckin, undoScan } from "@/src/lib/actions/admin";

type Props = { reg: Participant; details: RegDetails; admin: { id: string; role: string }; locked?: boolean };

// Rundown milik peserta ini saja (item khusus paket lain tidak termasuk), dengan status scan tiap pos.
export function ParticipantRundown({ reg, details, admin, locked }: Props) {
  const scanOf = new Map(reg.scans.map((s) => [s.checkpointId, s]));
  const mine = reg.event.checkpoints.filter((c) => appliesTo(c, details));
  const excluded = reg.event.checkpoints.filter((c) => !appliesTo(c, details));
  const points = mine.filter((c) => c.scan);
  const done = points.filter((c) => scanOf.has(c.id)).length;
  const approved = reg.status === "approved";

  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <h2 className="font-semibold text-gray-900">Rundown peserta ini</h2>
        <span className="text-sm text-gray-600 tabular-nums">{done} / {points.length} pos</span>
      </div>
      {locked && (
        <p className="border-b border-gray-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Absen datang dulu di pelatihan ini untuk check-in manual atau membatalkan scan.
        </p>
      )}
      {!approved && (
        <p className="border-b border-gray-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">Check-in hanya untuk peserta yang sudah disetujui.</p>
      )}
      <ol className="divide-y divide-gray-100">
        {mine.length === 0 && <li className="px-5 py-4 text-sm text-gray-500">Belum ada rundown.</li>}
        {mine.map((c, i) => {
          const scan = scanOf.get(c.id);
          const special = audienceLabel(c);
          return (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  scan ? "bg-green-600 text-white" : c.scan ? "border border-gray-300 text-gray-500" : "bg-gray-100 text-gray-400"
                }`}
              >
                {scan ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {c.name}
                  {special && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Khusus {special}</span>}
                </p>
                {(c.date || c.startTime || c.place) && <p className="text-xs text-gray-600">{[fmtWhen(c.date, c.startTime, c.endTime), c.place].filter(Boolean).join(" · ")}</p>}
                <p className="text-xs text-gray-500">
                  {CHECKPOINT_KIND[c.kind]}
                  {!c.scan
                    ? " · Agenda (tanpa scan)"
                    : scan
                      ? ` · Hadir ${fmtDateTime(scan.createdAt)} oleh ${scan.adminId === admin.id ? "Anda" : scan.admin.name}`
                      : " · Belum"}
                </p>
              </div>
              {scan && !locked && canUndoScan(admin, scan) && (
                <form action={undoScan.bind(null, scan.id)}>
                  <ConfirmSubmit message={`Batalkan check-in ${reg.user.name} di "${c.name}"?`} className="btn btn-danger btn-sm">Batalkan</ConfirmSubmit>
                </form>
              )}
              {c.scan && !scan && approved && !locked && (
                <form action={manualCheckin.bind(null, reg.id, c.id)}>
                  <ConfirmSubmit message={`Tandai ${reg.user.name} hadir di "${c.name}"?`} className="btn btn-secondary btn-sm">Tandai hadir</ConfirmSubmit>
                </form>
              )}
            </li>
          );
        })}
      </ol>
      {excluded.length > 0 && (
        <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
          Tidak termasuk rundown peserta ini: {excluded.map((c) => `${c.name} (khusus ${audienceLabel(c)})`).join(", ")}.
        </p>
      )}
      <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
        Pakai &quot;Tandai hadir&quot; bila QR peserta tidak bisa dipindai.
        {admin.role === "superadmin" ? " Superadmin bisa membatalkan semua check-in." : ` Anda bisa membatalkan check-in milik Anda dalam ${UNDO_MINUTES} menit.`}
      </p>
    </section>
  );
}
