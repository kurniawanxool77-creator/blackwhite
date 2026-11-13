import { Link } from "react-router-dom";
import { SiteForm } from "@/components/admin/SiteForm";
import type { Site } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function SuperadminSitePage() {
  const state = useApiData<{ site: Site }>("/api/superadmin/site");

  return (
    <DataGate state={state}>
      {({ site }) => (
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Halaman depan</h1>
              <p className="mt-1 text-sm text-gray-600">Konten company profile di halaman utama. Daftar event dan artikel tampil otomatis.</p>
            </div>
            <Link to="/" target="_blank" className="btn btn-secondary btn-sm">Lihat halaman</Link>
          </div>
          <SiteForm key={site.name + site.heroImage + site.aboutImage + site.loginImage} site={site} />
        </div>
      )}
    </DataGate>
  );
}
