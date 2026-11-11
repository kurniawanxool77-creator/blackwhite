import Link from "next/link";
import { isRunning } from "@/lib/checkin";
import { AttendanceButton } from "./AttendanceButton";

type Event = { id: string; name: string; startDate: Date; endDate: Date };

// Pengganti fitur event selama panitia belum absen datang: jelaskan syaratnya dan sediakan tombol absen.
export function DutyGate({ event, backHref }: { event: Event; backHref?: string }) {
  const running = isRunning(event);
  return (
    <div className="mx-auto max-w-xl">
      {backHref && <Link href={backHref} className="text-sm text-gray-600 hover:text-gray-900">← Kembali</Link>}
      <section className="card mt-2 p-6 text-center">
        <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">Fitur event terkunci</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">{event.name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {running
            ? "Absen datang dengan foto selfie dulu untuk membuka scan dan check-in di pelatihan ini."
            : "Absensi dan scan hanya bisa dilakukan pada hari pelatihan berlangsung."}
        </p>
        {running && (
          <div className="mt-4 flex justify-center">
            <AttendanceButton eventId={event.id} type="in" className="btn btn-success w-full sm:w-auto" />
          </div>
        )}
      </section>
    </div>
  );
}
