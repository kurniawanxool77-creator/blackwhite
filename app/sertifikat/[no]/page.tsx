import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ui/PrintButton";
import { db } from "@/lib/db";
import { fmtDate, fmtDateRange } from "@/lib/format";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sertifikat", robots: { index: false } };

// Sertifikat publik: siapa pun yang punya nomornya bisa memeriksa keaslian. Cetak = A4 mendatar.
export default async function CertificatePage({ params }: PageProps<"/sertifikat/[no]">) {
  const { no } = await params;
  const [reg, site] = await Promise.all([
    db.registration.findUnique({ where: { certificateNo: no }, include: { user: { select: { name: true } }, event: true } }),
    getSite(),
  ]);
  if (!reg?.certifiedAt) notFound();

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0; } @media print { html, body { background: #fff; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="flex items-center gap-2 text-sm font-medium text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-600" /> Sertifikat asli · terdaftar di {site.name}
        </p>
        <div className="flex gap-2">
          <Link href="/dashboard" className="btn btn-secondary">Tiket saya</Link>
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto aspect-[297/210] w-full max-w-4xl bg-white p-[3%] shadow-lg print:max-w-none print:shadow-none">
        <div className="flex h-full flex-col items-center justify-between border-[6px] border-double border-brand px-[6%] py-[4%] text-center">
          <p className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">{site.name}</p>

          <div>
            <p className="text-[clamp(1.25rem,4vw,2.5rem)] font-bold tracking-[0.2em] text-brand">SERTIFIKAT</p>
            <p className="mt-[1.5%] text-[clamp(0.7rem,1.4vw,0.95rem)] text-gray-600">Diberikan kepada</p>
            <p className="mt-[1%] border-b border-gray-300 px-6 pb-[1%] text-[clamp(1.1rem,3.6vw,2.25rem)] font-semibold text-gray-900">{reg.user.name}</p>
            <p className="mt-[2%] text-[clamp(0.7rem,1.4vw,0.95rem)] text-gray-600">atas keikutsertaan dan kelulusan dalam</p>
            <p className="mt-[0.5%] text-[clamp(0.9rem,2.2vw,1.4rem)] font-semibold text-gray-900">{reg.event.name}</p>
            <p className="mt-[0.5%] text-[clamp(0.65rem,1.3vw,0.875rem)] text-gray-600">
              {reg.event.location} · {fmtDateRange(reg.event.startDate, reg.event.endDate)}
            </p>
          </div>

          <div className="flex w-full items-end justify-between gap-4 text-left text-[clamp(0.55rem,1.1vw,0.75rem)] text-gray-600">
            <div>
              <p>No. sertifikat</p>
              <p className="font-mono font-semibold text-gray-900">{reg.certificateNo}</p>
              <p className="mt-1">Diterbitkan {fmtDate(reg.certifiedAt)}</p>
            </div>
            <div className="text-center">
              <div className="mb-1 h-[clamp(1.5rem,5vw,3rem)] w-[clamp(7rem,18vw,12rem)] border-b border-gray-400" />
              <p className="font-semibold text-gray-900">Penyelenggara</p>
              <p>{site.name}</p>
            </div>
          </div>
        </div>
      </article>
      <p className="mx-auto mt-3 max-w-4xl text-center text-xs text-gray-500 print:hidden">Keaslian sertifikat dapat diperiksa di alamat halaman ini menggunakan nomor sertifikat.</p>
    </main>
  );
}
