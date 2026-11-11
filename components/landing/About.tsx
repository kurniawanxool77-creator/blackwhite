import type { Site } from "@/lib/site";

export function About({ site }: { site: Site }) {
  return (
    <section id="tentang" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-14">
      <div className={`grid items-center gap-10 ${site.aboutImage ? "md:grid-cols-2" : ""}`}>
        {site.aboutImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.aboutImage} alt="Tentang kami" loading="lazy" className="aspect-[4/3] w-full rounded-md border border-gray-200 object-cover" />
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Tentang kami</h2>
          <p className="mt-4 leading-relaxed whitespace-pre-line text-gray-700">{site.about}</p>
          <dl className="mt-6 grid gap-2 border-t border-gray-200 pt-4 text-sm text-gray-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-900">Email</dt>
              <dd>{site.contact.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Telepon</dt>
              <dd>{site.contact.phone}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
