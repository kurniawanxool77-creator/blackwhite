import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/site";
import { SiteForm } from "@/components/admin/SiteForm";

export default async function SiteEditorPage() {
  await requireAdmin("superadmin");
  const site = await getSite();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Halaman depan</h1>
          <p className="mt-1 text-sm text-gray-600">Konten company profile di halaman utama. Daftar event dan artikel tampil otomatis.</p>
        </div>
        <Link href="/" target="_blank" className="btn btn-secondary btn-sm">Lihat halaman</Link>
      </div>
      <SiteForm site={site} />
    </div>
  );
}
