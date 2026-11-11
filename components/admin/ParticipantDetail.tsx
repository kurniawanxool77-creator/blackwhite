import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { FormAnswers } from "@/components/ui/FormAnswers";
import { fmtDateTime, fmtRupiah, REG_STATUS } from "@/lib/format";
import type { Participant } from "@/lib/participant";
import { answersIn, healthAlerts, itemAnswers, readDetails } from "@/lib/registration-form";
import { ParticipantRundown } from "./ParticipantRundown";

type Props = { reg: Participant; admin: { id: string; role: string }; backHref: string; locked?: boolean }; // locked: panitia belum absen datang

// Detail satu peserta di satu event: identitas, kondisi kesehatan, barang bawaan, kontak darurat,
// rundown miliknya (sesuai paket/pilihan), dan data pendaftaran lainnya.
export function ParticipantDetail({ reg, admin, backHref, locked }: Props) {
  const approved = reg.status === "approved";
  const details = readDetails(reg.details);
  const health = healthAlerts(details);
  const items = itemAnswers(details);
  const emergency = answersIn(details, "darurat");
  const general = [
    ...answersIn(details, "umum"),
    ...(details.total ? [{ id: "total", label: "Total biaya", type: "text" as const, value: fmtRupiah(details.total) }] : []),
    ...(details.paymentProof ? [{ id: "proof", label: "No. referensi transfer", type: "text" as const, value: details.paymentProof }] : []),
    ...(details.paymentProofUrl ? [{ id: "proofImg", label: "Bukti transfer", type: "file" as const, value: details.paymentProofUrl }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-gray-500 hover:text-brand">← {reg.event.name}</Link>
        <div className="card mt-2 flex flex-wrap items-start gap-4 p-5">
          <UserAvatar name={reg.user.name} image={reg.user.image} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {reg.user.name}
              {reg.code && <span className="ml-2 rounded border border-gray-300 px-2 py-0.5 align-middle font-mono text-sm text-gray-800">{reg.code}</span>}
            </h1>
            <p className="text-sm text-gray-600">{reg.user.organization ?? "Tanpa instansi"}</p>
            <p className="mt-1 text-sm text-gray-600">{reg.user.email} · {reg.user.phone ?? "tanpa no. HP"}</p>
            <p className="mt-1 text-xs text-gray-500">Mendaftar {fmtDateTime(reg.createdAt)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
              {health.length > 0 && <a href="#kesehatan" className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">Ada catatan kesehatan</a>}
              {items.length > 0 && <a href="#barang" className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">Bawa barang</a>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={reg.status} label={REG_STATUS[reg.status]} />
            {admin.role === "superadmin" && approved && (
              <a href={`/superadmin/qr/${reg.id}`} target="_blank" className="btn btn-secondary btn-sm">Lihat QR</a>
            )}
          </div>
        </div>
        {reg.status === "rejected" && reg.rejectReason && <p className="mt-2 text-sm text-gray-600">Alasan ditolak: {reg.rejectReason}</p>}
      </div>

      <FormAnswers id="kesehatan" title="Kondisi kesehatan" answers={health} tone="danger" empty={answersIn(details, "kesehatan").length ? "Tidak ada catatan penyakit atau alergi." : undefined} />
      <FormAnswers id="barang" title="Barang bawaan" answers={items} />
      <FormAnswers id="darurat" title="Kontak darurat" answers={emergency} />
      <ParticipantRundown reg={reg} details={details} admin={admin} locked={locked} />
      <FormAnswers title="Data pendaftaran" answers={general} />
    </div>
  );
}
