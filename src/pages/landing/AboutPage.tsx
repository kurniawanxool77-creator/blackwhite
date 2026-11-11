import { About } from "@/components/landing/About";
import { Services } from "@/components/landing/Services";
import { useAuth } from "@/src/lib/auth-client";

export function AboutPage() {
  const { site } = useAuth();
  return (
    <div className="pb-8">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <p className="text-xs font-semibold tracking-wider text-brand uppercase">Profil Lembaga</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 md:text-3xl">Tentang {site.name}</h1>
        <p className="mt-1 text-sm text-gray-600">{site.tagline}</p>
      </div>
      <About site={site} />
      <Services services={site.services} />
    </div>
  );
}

