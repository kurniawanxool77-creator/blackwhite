import type { Checkpoint, Event, Registration } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { EventDetailTabs } from "@/components/landing/EventDetailTabs";
import { EventGallery } from "@/components/landing/EventGallery";
import { RegisterForm } from "@/components/landing/RegisterForm";
import { FormAnswers } from "@/components/ui/FormAnswers";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";
import { PriceTag } from "@/components/ui/PriceTag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { durationDays, EVENT_MODE, EVENT_STATUS, fmtDate, fmtDateRange, fmtNum, REG_STATUS } from "@/lib/format";
import type { FormField, RegDetails } from "@/lib/registration-form";
import type { ShuttleOption } from "@/lib/shuttle";
import type { BankAccount } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

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
  const state = useApiData<PublicEventDetail>(slug ? `/api/public/events/${encodeURIComponent(slug)}` : null);

  return (
    <DataGate state={state} notFoundTitle="Pelatihan tidak ditemukan" backTo="/event">
      {({ event, user, existing, seatsLeft, closed, shuttles, banks, fields, savedDetails }) => {
        const photos = parsePhotos(event.coverUrl, event.gallery);
        const days = durationDays(event.startDate, event.endDate);
        const canRegister = event.status === "open" && !closed && (seatsLeft === null || seatsLeft > 0);
        const regEndPast = event.registrationEnd ? new Date(event.registrationEnd) < new Date() : false;

        return (
          <div className="mx-auto max-w-6xl px-4 py-4 md:py-10">
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
              <Link to="/" className="hover:text-brand">Beranda</Link>
              <span>/</span>
              <Link to="/event" className="hover:text-brand">Pelatihan</Link>
              <span>/</span>
              <span className="truncate font-medium text-gray-800">{event.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-8">
                <EventGallery photos={photos} title={event.name} />

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={event.status} label={EVENT_STATUS[event.status] ?? event.status} />
                  {event.category && (
                    <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {event.category}
                    </span>
                  )}
                  <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {EVENT_MODE[event.mode] ?? event.mode}
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-bold tracking-tight text-gray-900 md:text-3xl">{event.name}</h1>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {fmtDateRange(event.startDate, event.endDate)} ({days} hari)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    {event.location}
                  </span>
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

              <aside className="lg:col-span-4">
                <div className="card sticky top-20 p-5">
                  <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs text-gray-500">Biaya pendaftaran</p>
                    <PriceTag event={event} className="mt-1 text-xl" />
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span>{fmtNum(event._count.registrations)} peserta terdaftar</span>
                      {event.quota !== null && (
                        <span>
                          {seatsLeft === 0 ? (
                            <span className="font-medium text-red-700">Kuota penuh</span>
                          ) : (
                            `Sisa ${fmtNum(seatsLeft ?? 0)} dari ${fmtNum(event.quota)} kursi`
                          )}
                        </span>
                      )}
                    </div>
                    {event.registrationEnd && (
                      <p className="mt-1 text-xs text-gray-500">Batas daftar: {fmtDate(event.registrationEnd)}</p>
                    )}
                  </div>

                  <div className="pt-4">
                    {existing ? (
                      <div className="space-y-4">
                        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm">
                          <p className="font-semibold text-green-900">Anda sudah terdaftar</p>
                          <p className="mt-1 text-xs text-green-800">
                            Status: <strong>{REG_STATUS[existing.status] ?? existing.status}</strong>
                          </p>
                          <Link to={`/tiket/${existing.id}`} className="btn btn-primary mt-3 w-full text-xs">
                            Lihat tiket saya
                          </Link>
                        </div>
                        {savedDetails && savedDetails.answers.length > 0 && (
                          <FormAnswers answers={savedDetails.answers} title="Jawaban formulir Anda" />
                        )}
                      </div>
                    ) : !user ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Masuk atau buat akun terlebih dahulu untuk mendaftar pelatihan ini.</p>
                        <Link to={`/login?callbackUrl=${encodeURIComponent(`/event/${event.slug}`)}`} className="btn btn-primary w-full">
                          Masuk untuk mendaftar
                        </Link>
                        <Link to="/daftar" className="btn btn-secondary w-full">
                          Daftar akun baru
                        </Link>
                      </div>
                    ) : !canRegister ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="font-semibold">Pendaftaran tidak tersedia</p>
                        <p className="mt-1 text-xs">
                          {seatsLeft === 0
                            ? "Kuota peserta sudah terpenuhi."
                            : regEndPast || closed
                              ? "Masa pendaftaran untuk event ini sudah berakhir."
                              : "Pendaftaran untuk event ini sedang ditutup."}
                        </p>
                      </div>
                    ) : (
                      <RegisterForm
                        eventId={event.id}
                        phone={user.phone ?? ""}
                        organization={user.organization ?? ""}
                        price={event.price}
                        fields={fields}
                        banks={banks}
                        routes={shuttles}
                      />
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}

