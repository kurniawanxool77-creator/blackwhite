import type { Checkpoint, Event, Registration } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { EventDetailTabs } from "@/components/landing/EventDetailTabs";
import { EventGallery } from "@/components/landing/EventGallery";
import { RegisterForm } from "@/components/landing/RegisterForm";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { durationDays, EVENT_MODE, finalPrice, fmtDate, fmtDateRange, fmtNum, REG_STATUS } from "@/lib/format";
import type { FormField, RegDetails } from "@/lib/registration-form";
import type { ShuttleOption } from "@/lib/shuttle";
import type { BankAccount } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

type PublicEventDetail = {
  event: Event & {
    checkpoints: Checkpoint[];
    _count: { registrations: number; lessons: number; questions: number };
  };
  user: { id: string; name: string; email: string; phone: string | null; organization: string | null } | null;
  existing: Registration | null;
  seatsLeft: number | null;
  closed: boolean;
  shuttles: ShuttleOption[];
  banks: BankAccount[];
  siteName: string;
  fields: FormField[];
  savedDetails: RegDetails | null;
};

function parsePhotos(coverUrl: string | null, rawGallery: string | null): string[] {
  const photos: string[] = coverUrl ? [coverUrl] : [];
  try {
    const parsed = JSON.parse(rawGallery || "[]");
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === "string" && item && !photos.includes(item)) photos.push(item);
      }
    }
  } catch {
    // ignore malformed gallery JSON
  }
  return photos;
}

export function EventDetailPage() {
  const { slug } = useParams();
  const { googleEnabled } = useAuth();
  const state = useApiData<PublicEventDetail>(slug ? `/api/public/events/${encodeURIComponent(slug)}` : null);

  return (
    <DataGate state={state} notFoundTitle="Pelatihan tidak ditemukan" backTo="/event">
      {({ event, user, existing, seatsLeft, closed, shuttles, banks, fields }) => {
        const photos = parsePhotos(event.coverUrl, event.gallery);
        const days = durationDays(event.startDate, event.endDate);

        return (
          <div className="mx-auto max-w-6xl px-4 py-4 md:py-8">
            <Link to="/event" className="inline-flex min-h-9 items-center text-sm text-gray-600 hover:text-gray-900">
              ← Semua pelatihan
            </Link>

            <div className="mt-2 grid gap-6 md:mt-4 lg:grid-cols-3 lg:gap-8">
              <div className="min-w-0 lg:col-span-2">
                <EventGallery photos={photos} title={event.name} />
                {event.category && <p className="text-sm font-medium tracking-wide text-brand uppercase">{event.category}</p>}
                <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 md:text-3xl">{event.name}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span>{event.location}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-800">{EVENT_MODE[event.mode] ?? event.mode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span>{fmtDateRange(event.startDate, event.endDate)} ({days} hari)</span>
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
                {event.registrationEnd && (
                  <p className="mt-1 text-xs text-gray-600">Pendaftaran sampai {fmtDate(event.registrationEnd)}, 23.59 WIB</p>
                )}

                <div className="mt-4 border-t border-gray-200 pt-4">
                  {existing ? (
                    <div className="space-y-3 text-sm">
                      <p>
                        Status: <StatusBadge status={existing.status} label={REG_STATUS[existing.status] ?? existing.status} />
                      </p>
                      {existing.status === "rejected" && existing.rejectReason && (
                        <p className="text-gray-600">Alasan: {existing.rejectReason}</p>
                      )}
                      <Link to={`/tiket/${existing.id}`} className="btn btn-primary w-full">
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
                      fields={fields}
                      banks={banks}
                      routes={shuttles}
                    />
                  ) : (
                    <div className="space-y-3">
                      {googleEnabled && (
                        <GoogleSignInButton callbackUrl={`/event/${event.slug}`} label="Daftar dengan Google" />
                      )}
                      <p className="text-center text-xs text-gray-500">
                        {googleEnabled ? "atau " : "Masuk untuk daftar · "}
                        <Link to={`/login?callbackUrl=${encodeURIComponent(`/event/${event.slug}`)}`} className="font-medium text-green-700 hover:underline">
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
      }}
    </DataGate>
  );
}

