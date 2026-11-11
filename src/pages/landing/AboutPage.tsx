import { Link } from "react-router-dom";
import { About } from "@/components/landing/About";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { useAuth } from "@/src/lib/auth-client";

export function AboutPage() {
  const { site } = useAuth();
  return (
    <>
      <Hero site={site} />
      <About site={site} />
      <Services services={site.services} />

      {site.steps.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-5 md:py-14">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cara kerja untuk peserta</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {site.steps.map((step, i) => (
              <li key={step} className="card flex gap-3 p-4 text-sm">
                <span className="font-semibold text-gray-900">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <Link to="/daftar" className="btn btn-success mt-8">Daftar sekarang</Link>
        </section>
      )}
    </>
  );
}

