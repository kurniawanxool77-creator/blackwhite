import type { Site } from "@/lib/site";

export function Services({ services }: { services: Site["services"] }) {
  if (services.length === 0) return null;
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Layanan kami</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {services.map((s, i) => (
            <div key={s.title} className="group card card-link animate-rise overflow-hidden" style={{ animationDelay: `${i * 90}ms` }}>
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              )}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
