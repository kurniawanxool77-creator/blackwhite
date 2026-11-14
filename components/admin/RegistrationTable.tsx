import { useState } from "react";
import type { Registration, User } from "@prisma/client";
import Link from "next/link";
import { useNavigate } from "react-router-dom";
import { approveRegistrations, deleteRegistration, rejectRegistration } from "@/src/lib/actions/events";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { DownloadIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtDateTime, fmtNum, fmtRupiah, REG_STATUS } from "@/lib/format";
import { healthAlerts, itemAnswers, readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";

type Props = {
  eventId: string;
  filter: string;
  counts: Record<string, number>;
  checkpoints: { id: string; scan: boolean; audience: string }[];
  registrations: (Registration & { user: User; _count: { scans: number } })[];
  readOnly?: boolean;
  q?: string;
  detailBase: string;
  tab?: string;
  mode?: string;
  useQr?: boolean;
};

const TABS = [
  { key: "pending", label: "Menunggu" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
  { key: "all", label: "Semua" },
];

export function RegistrationTable({
  eventId,
  filter,
  counts,
  checkpoints,
  registrations,
  readOnly,
  q,
  detailBase,
  tab = "peserta",
  mode,
  useQr = true,
}: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState(q ?? "");
  const [prevQ, setPrevQ] = useState(q ?? "");
  if (prevQ !== (q ?? "")) {
    setPrevQ(q ?? "");
    setSearch(q ?? "");
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const isOnline = mode === "online";
  const hasScans = useQr && !isOnline && checkpoints.some((c) => c.scan);

  const tabHref = (status: string, nextQ = q) => {
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    params.set("status", status);
    if (nextQ) params.set("q", nextQ);
    return `?${params.toString()}`;
  };

  const exportParams = new URLSearchParams({ status: filter });
  if (q) exportParams.set("q", q);
  const exportHref = `/superadmin/events/${eventId}/export?${exportParams.toString()}`;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        {/* Sub-filter segmented control */}
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-gray-100 p-1 text-xs">
          {TABS.map((t) => {
            const on = filter === t.key;
            const count = t.key === "all" ? total : (counts[t.key] ?? 0);
            return (
              <Link
                key={t.key}
                href={tabHref(t.key)}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-medium transition-all ${
                  on
                    ? "bg-white text-gray-900 font-semibold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    on ? "bg-green-50 text-brand font-bold" : "text-gray-500"
                  }`}
                >
                  {fmtNum(count)}
                </span>
              </Link>
            );
          })}
        </div>

        {!readOnly && filter === "pending" && (counts.pending ?? 0) > 0 && (
          <form action={approveRegistrations.bind(null, eventId, null)}>
            <button className="btn btn-primary btn-sm">Setujui semua yang menunggu</button>
          </form>
        )}
      </div>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(tabHref(filter, search.trim()));
        }}
        className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-60">
          <input
            name="q"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor peserta, nama, email, no. HP, atau instansi"
            aria-label="Cari peserta"
            className="input max-w-sm flex-1"
          />
          <button className="btn btn-secondary btn-sm">Cari</button>
          {q && (
            <>
              <span className="text-sm text-gray-600">{fmtNum(registrations.length)} hasil untuk &quot;{q}&quot;</span>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  navigate(tabHref(filter, ""));
                }}
                className="text-sm text-brand hover:underline font-medium"
              >
                Reset
              </button>
            </>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <a href={exportHref} className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
              <DownloadIcon className="h-3.5 w-3.5" />
              Unduh CSV ({fmtNum(registrations.length)})
            </a>
            {(filter !== "all" || q) && total > registrations.length && (
              <a
                href={`/superadmin/events/${eventId}/export?status=all`}
                className="text-xs font-medium text-brand hover:underline whitespace-nowrap"
              >
                Semua ({fmtNum(total)})
              </a>
            )}
          </div>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Peserta</th>
              <th>Kontak</th>
              <th>Daftar</th>
              <th>Status</th>
              <th>Bukti Bayar</th>
              <th>{hasScans ? "Pos QR Terpindai" : "Tiket & Akses"}</th>
              {!readOnly && <th className="text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="text-center text-gray-500 py-8">
                  {q
                    ? "Tidak ada peserta yang cocok dengan kata kunci pencarian."
                    : filter === "pending"
                    ? "Tidak ada pendaftaran yang sedang menunggu persetujuan."
                    : filter === "approved"
                    ? "Belum ada peserta yang disetujui."
                    : filter === "rejected"
                    ? "Tidak ada pendaftaran yang ditolak."
                    : "Belum ada peserta yang mendaftar di event ini."}
                </td>
              </tr>
            )}
            {registrations.map((r) => {
              const d = readDetails(r.details);
              const health = healthAlerts(d);
              const items = itemAnswers(d);
              const totalScans = checkpoints.filter((c) => c.scan && appliesTo(c, d)).length;
              const hasProof = !!(d.paymentProof || d.paymentProofUrl);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={r.user.name} image={r.user.image} size={36} />
                      <div className="min-w-0">
                        <Link href={`${detailBase}/${r.id}`} className="font-semibold text-brand hover:underline">
                          {r.user.name}
                        </Link>
                        {r.code && <span className="ml-1.5 font-mono text-xs text-gray-700">({r.code})</span>}
                        <p className="text-xs text-gray-500">{r.user.organization ?? "-"}</p>
                        {(health.length > 0 || items.length > 0) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {health.length > 0 && (
                              <Link
                                href={`${detailBase}/${r.id}#kesehatan`}
                                title={health.map((a) => a.value).join(" · ")}
                                className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                              >
                                Kesehatan
                              </Link>
                            )}
                            {items.length > 0 && (
                              <Link
                                href={`${detailBase}/${r.id}#barang`}
                                title={items.filter((a) => a.type !== "file").map((a) => a.value).join(" · ")}
                                className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
                              >
                                Bawa barang
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-gray-900 font-medium">{r.user.email}</p>
                    <p className="text-xs text-gray-500">{r.user.phone ?? "-"}</p>
                  </td>
                  <td className="whitespace-nowrap font-mono text-xs text-gray-600">
                    {fmtDateTime(r.createdAt)}
                  </td>
                  <td>
                    <StatusBadge status={r.status} label={REG_STATUS[r.status]} />
                    {r.rejectReason && <p className="mt-1 text-xs text-gray-500">{r.rejectReason}</p>}
                  </td>
                  <td>
                    {hasProof ? (
                      <div className="flex flex-col gap-1">
                        {d.paymentProofUrl && (
                          <a href={d.paymentProofUrl} target="_blank" rel="noreferrer" className="inline-block shrink-0">
                            <img
                              src={d.paymentProofUrl}
                              alt="Bukti transfer"
                              className="h-14 w-14 rounded border border-gray-200 object-cover hover:opacity-80 transition"
                              title="Klik untuk perbesar"
                            />
                          </a>
                        )}
                        {d.paymentProof && (
                          <p className="text-xs text-gray-700 font-mono leading-tight max-w-[8rem] break-all">
                            {d.paymentProof}
                          </p>
                        )}
                        {d.total != null && d.total > 0 && (
                          <p className="text-xs font-semibold text-gray-900 tabular-nums">
                            {fmtRupiah(d.total)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {d.total != null && d.total > 0 ? (
                          <span className="text-amber-700 font-medium">{fmtRupiah(d.total)} · belum ada bukti</span>
                        ) : "—"}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {hasScans ? (
                      r.status === "approved" ? (
                        <span className="font-medium text-gray-700">
                          {fmtNum(r._count.scans)} / {fmtNum(totalScans)} pos
                        </span>
                      ) : (
                        "-"
                      )
                    ) : r.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-800 border border-gray-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                        Tiket Aktif
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  {!readOnly && (
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <Link href={`${detailBase}/${r.id}`} className="btn btn-secondary btn-sm">
                          Detail
                        </Link>
                        {r.status === "approved" && useQr && (
                          <a href={`/superadmin/qr/${r.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            Lihat Tiket
                          </a>
                        )}
                        {r.status !== "approved" && (
                          <form action={approveRegistrations.bind(null, eventId, [r.id])}>
                            <button className="btn btn-primary btn-sm">Setujui</button>
                          </form>
                        )}
                        {r.status !== "rejected" && (
                          <form action={rejectRegistration.bind(null, r.id)} className="flex gap-1">
                            <input name="reason" placeholder="Alasan" className="input w-28 py-1 text-xs" />
                            <button className="btn btn-danger btn-sm">Tolak</button>
                          </form>
                        )}
                        <form action={deleteRegistration.bind(null, r.id)}>
                          <ConfirmSubmit
                            message={`Hapus pendaftaran ${r.user.name}? Riwayat scan, nilai kuis, dan sertifikatnya ikut terhapus.`}
                            className="btn btn-secondary btn-sm text-red-700 hover:bg-red-50"
                          >
                            Hapus
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
