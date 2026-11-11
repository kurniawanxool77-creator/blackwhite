import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { PriceTag } from "@/components/ui/PriceTag";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";
import type { ReadyEvent } from "@/lib/event-search";
import { EVENT_MODE, fmtDateRange, fmtNum } from "@/lib/format";

export function EventCard({ event, index }: { event: ReadyEvent; index: number }) {
  return (
    <Link
      href={`/event/${event.slug}`}
      className="group card card-link animate-rise flex flex-col overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {event.coverUrl ? (
          <img
            src={event.coverUrl}
            alt={event.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PhotoPlaceholder />
        )}
        {event.category && (
          <span className="absolute top-2.5 left-2.5 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white uppercase backdrop-blur-sm">
            {event.category}
          </span>
        )}
        {event.seatsLeft !== null && (
          <span
            className={`absolute top-2.5 right-2.5 rounded px-2 py-0.5 text-xs font-semibold shadow-sm ${
              event.seatsLeft === 0 ? "bg-red-600 text-white" : event.seatsLeft <= 5 ? "bg-amber-400 text-gray-900" : "bg-white/95 text-gray-900"
            }`}
            title={event.seatsLeft === 0 ? "Kuota penuh" : `Sisa ${event.seatsLeft} dari ${event.quota} kursi`}
          >
            {event.seatsLeft === 0 ? "Kuota penuh" : `Kuota ${fmtNum(event.seatsLeft)}/${fmtNum(event.quota ?? 0)}`}
          </span>
        )}
        {(event.type === "course" || event.mode !== "offline") && (
          <span className="absolute bottom-2.5 left-2.5 rounded bg-brand px-2 py-0.5 text-xs font-semibold text-white">
            {event.type === "course" ? "Pelatihan video" : (EVENT_MODE[event.mode] ?? event.mode)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-brand">
          {event.name}
        </h3>

        <div className="mt-3 mb-4 space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span>
              {fmtDateRange(event.startDate, event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPinIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <PriceTag event={event} className="mt-auto border-t border-gray-100 pt-3" />
      </div>
    </Link>
  );
}
