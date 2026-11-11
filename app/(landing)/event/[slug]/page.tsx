import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { EventDetailTabs } from "@/components/landing/EventDetailTabs";
import { EventGallery } from "@/components/landing/EventGallery";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventPhotos } from "@/lib/gallery";
import { seatsLeftOf } from "@/lib/event-search";
import { parseFields } from "@/lib/registration-form";
import { registrationClosed } from "@/lib/participant-code";
import { shuttleOptions } from "@/lib/shuttle";
import { durationDays, EVENT_MODE, finalPrice, fmtDate, fmtDateRange, fmtNum, REG_STATUS } from "@/lib/format";import type { Metadata } from "next";
import { absoluteUrl, jsonLd, metaDescription } from "@/lib/seo";
import { getSite, parseBanks } from "@/lib/site";
import { RegisterForm } from "./RegisterForm";

// Judul & deskripsi pencarian, plus pratinjau saat tautan dibagikan (WhatsApp, Facebook).
export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await db.event.findUnique({ where: { slug } });
  if (!e || e.status === "draft") return { title: "Pelatihan tidak ditemukan", robots: { index: false } };
  const description = metaDescription(e.description, `${e.name} di ${e.location}, ${fmtDateRange(e.startDate, e.endDate)}. Daftar online dan dapatkan sertifikat.`);
  return {
    title: `${e.name}${e.category ? ` · ${e.category}` : ""} di ${e.location}`,
    description,
    alternates: { canonical: `/event/${e.slug}` },
    openGraph: { title: e.name, description, images: e.coverUrl ? [{ url: e.coverUrl }] : undefined },
  };
}

const ATTENDANCE: Record<string, string> = {
  offline: "https://schema.org/OfflineEventAttendanceMode",
  online: "https://schema.org/OnlineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

export default async function EventPage({ params }: PageProps<"/event/[slug]">) {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    include: { checkpoints: { orderBy: { order: "asc" } } },
  });
  if (!event || event.status === "draft") notFound();

  const session = await getSession();
  const userId = session?.user.role === "user" ? session.user.id : null;
  const [seatsLeft, site] = await Promise.all([seatsLeftOf(event), getSite()]);
  const url = absoluteUrl(`/event/${event.slug}`);
  const closed = registrationClosed(event); // lewat batas pendaftaran
  // Data terstruktur schema.org/Event agar Google bisa menampilkan tanggal, lokasi, dan harga di hasil pencarian.
  const structured = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: metaDescription(event.description, event.name),
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: ATTENDANCE[event.mode] ?? ATTENDANCE.offline,
    location: event.mode === "online" ? { "@type": "VirtualLocation", url } : { "@type": "Place", name: event.location, address: event.location },
    image: eventPhotos(event).map(absoluteUrl),
    organizer: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
    offers: {
      "@type": "Offer",
      url,
      price: finalPrice(event),
      priceCurrency: "IDR",
      availability: seatsLeft === 0 || event.status !== "open" || closed ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      validFrom: event.createdAt.toISOString(),
    },
  };
  const days = durationDays(event.startDate, event.endDate);
  const [user, registration] = userId
    ? await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.registration.findUnique({ where: { userId_eventId: { userId, eventId: event.id } } }),
      ])
    : [null, null];

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
      <Link href="/event" className="inline-flex min-h-9 items-center text-sm text-gray-600 hover:text-gray-900">← Semua pelatihan</Link>
      <div className="mt-2 grid gap-6 md:mt-4 lg:grid-cols-3 lg:gap-8">
        {/* min-w-0: strip thumbnail tidak boleh melebarkan kolom melewati layar HP */}
        <div className="min-w-0 lg:col-span-2">
          <EventGallery photos={eventPhotos(event)} title={event.name} />
          {event.category && <p className="text-sm font-medium uppercase tracking-wide text-brand">{event.category}</p>}
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 md:text-3xl">{event.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-700">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4 text-gray-400" />
              <span>{event.location}</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-800">{EVENT_MODE[event.mode] ?? event.mode}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>
                {fmtDateRange(event.startDate, event.endDate)} ({days} hari)
              </span>
            </div>
            {event.quota && seatsLeft !== null && (
              <span
                className={`rounded px-2 py-0.5 font-medium ${
                  seatsLeft === 0
                    ? "bg-red-50 text-red-700"
                    : seatsLeft <= 5
                    ? "bg-amber-50 text-amber-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                Kuota {fmtNum(event.quota)} · {seatsLeft === 0 ? "Penuh" : `Sisa ${fmtNum(seatsLeft)} Kursi`}
              </span>
            )}
          </div>

          {/* Sub-Navbar / Tabs: Deskripsi, Rundown Acara, Lokasi & Jadwal */}
          <EventDetailTabs
            description={event.description}
            category={event.category}
            location={event.location}
            startDate={event.startDate}
            endDate={event.endDate}
            days={days}
            checkpoints={event.checkpoints}
            useQr={event.useQr}
          />
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold text-gray-900">Daftar pelatihan</h2>
          <PriceTag event={event} className="mt-2 text-lg" />
          {event.registrationEnd && <p className="mt-1 text-xs text-gray-600">Pendaftaran sampai {fmtDate(event.registrationEnd)}, 23.59 WIB</p>}
          <div className="mt-4 border-t border-gray-200 pt-4">
            {registration ? (
              <div className="space-y-3 text-sm">
                <p>
                  Status: <StatusBadge status={registration.status} label={REG_STATUS[registration.status]} />
                </p>
                {registration.status === "rejected" && registration.rejectReason && (
                  <p className="text-gray-600">Alasan: {registration.rejectReason}</p>
                )}
                <Link href={`/tiket/${registration.id}`} className="btn btn-primary w-full">
                  Lihat tiket
                </Link>
              </div>
            ) : event.status !== "open" || closed ? (
              <p className="text-sm text-gray-600">Pendaftaran sudah ditutup.</p>
            ) : seatsLeft === 0 ? (
              <p className="text-sm text-gray-600">Kuota sudah penuh.</p>
            ) : user ? (
              <RegisterForm
                eventId={event.id}
                phone={user.phone ?? ""}
                organization={user.organization ?? ""}
                price={finalPrice(event)}
                fields={parseFields(event.formFields)}
                banks={parseBanks(site.banks)}
                routes={await shuttleOptions(event.id)}
              />
            ) : (
              <div className="space-y-3">
                <GoogleSignInButton callbackUrl={`/event/${event.slug}`} label="Daftar dengan Google" />
                <p className="text-center text-xs text-gray-500">
                  atau{" "}
                  <Link href={`/login?callbackUrl=${encodeURIComponent(`/event/${event.slug}`)}`} className="font-medium text-green-700 hover:underline">
                    pakai email
                  </Link>
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
