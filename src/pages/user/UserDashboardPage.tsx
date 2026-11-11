import type { Event, Registration, Scan } from "@prisma/client";
import { Link, useSearchParams } from "react-router-dom";
import { CategoryFilter, categoryFilterItems } from "@/components/ui/CategoryFilter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MyQrCard } from "@/components/user/MyQrCard";
import { CalendarIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon } from "@/components/ui/icons";
import { fmtDateRange, REG_STATUS } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type DashboardReg = Registration & {
  event: Event & { checkpoints: { id: string; name: string; kind: string; audience: string }[] };
  scans: Pick<Scan, "checkpointId" | "createdAt">[];
};

type UserDashboardPayload = {
  greeting: string;
  firstName: string;
  registrations: DashboardReg[];
  categories: string[];
  me: { name: string; image: string | null } | null;
  myQr: string | null;
};

export function UserDashboardPage() {
  const [searchParams] = useSearchParams();
  const selectedCat = searchParams.get("kategori") || undefined;
  const state = useApiData<UserDashboardPayload>("/api/user/dashboard");

  return (
    <DataGate state={state}>
      {({ greeting, firstName, registrations, categories, me, myQr }) => {
        const filtered = selectedCat
          ? registrations.filter((r) => r.event.category === selectedCat)
          : registrations;
        const approvedCount = registrations.filter((r) => r.status === "approved").length;
        const pendingCount = registrations.filter((r) => r.status === "pending").length;
        const catItems = categoryFilterItems(categories, selectedCat, (c) =>
          c ? `/dashboard?kategori=${encodeURIComponent(c)}` : "/dashboard",
        );

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">{greeting},</p>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{firstName}</h1>
                <p className="mt-0.5 text-sm text-gray-600">Kelola tiket, barcode absensi, materi, dan sertifikat pelatihan Anda.</p>
              </div>
              <Link to="/event" className="btn btn-primary btn-sm">Cari pelatihan</Link>
            </div>

            {myQr && me && <MyQrCard qr={myQr} name={me.name} photo={me.image} />}

            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="text-xs text-gray-500">Total tiket</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{registrations.length}</p>
              </div>
              <div className="card p-4">
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" /> Disetujui
                </p>
                <p className="mt-1 text-2xl font-bold text-green-700 tabular-nums">{approvedCount}</p>
              </div>
              <div className="card p-4">
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <ClockIcon className="h-3.5 w-3.5 text-amber-600" /> Menunggu
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">{pendingCount}</p>
              </div>
            </div>

            <CategoryFilter items={catItems} />

            {filtered.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-gray-600">
                  {selectedCat ? `Belum ada pendaftaran untuk kategori "${selectedCat}".` : "Anda belum mendaftar pelatihan apa pun."}
                </p>
                <Link to="/event" className="btn btn-primary mt-4 inline-flex">Lihat pelatihan terbuka</Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/tiket/${r.id}`}
                      className="card card-link flex items-center justify-between gap-4 p-4 transition hover:border-gray-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={r.status} label={REG_STATUS[r.status] ?? r.status} />
                          {r.code && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">{r.code}</span>
                          )}
                          {r.event.category && (
                            <span className="text-xs text-gray-500">{r.event.category}</span>
                          )}
                        </div>
                        <p className="mt-1.5 font-semibold text-gray-900">{r.event.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {fmtDateRange(r.event.startDate, r.event.endDate)}
                          </span>
                          <span>· {r.event.location}</span>
                          {r.status === "approved" && r.event.checkpoints.length > 0 && (
                            <span>· {r.scans.length}/{r.event.checkpoints.length} pos scan</span>
                          )}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

