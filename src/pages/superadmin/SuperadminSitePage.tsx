import { PageHeader } from "@/components/admin/PageHeader";
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
          <PageHeader title="Halaman depan & brand" description="Atur nama brand, hero, gambar, layanan, rekening bank, dan informasi kontak." />
          <SiteForm site={site} />
        </div>
      )}
    </DataGate>
  );
}

