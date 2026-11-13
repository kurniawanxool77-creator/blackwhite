import type { Event, Lesson } from "@prisma/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { fmtDateRange, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type MaterialEvent = Event & {
  lessons: Lesson[];
  _count: { questions: number; registrations: number };
};

export function AdminMaterialsPage() {
  const state = useApiData<{ events: MaterialEvent[] }>("/api/admin/materi");

  return (
    <DataGate state={state}>
      {({ events }) => (
        <div className="space-y-6">
          <PageHeader title="Materi event" description="Ringkasan modul video, kuis, dan jumlah penerima sertifikat." />
          {events.length === 0 ? (
            <div className="card p-6 text-sm text-gray-600">Belum ada event aktif yang ditugaskan kepada Anda.</div>
          ) : (
            <div className="space-y-4">
              {events.map((e) => (
                <section key={e.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{e.name}</h2>
                      <p className="text-xs text-gray-500">
                        {fmtDateRange(e.startDate, e.endDate)} · {fmtNum(e.lessons.length)} materi · {fmtNum(e._count.questions)} soal kuis · {fmtNum(e._count.registrations)} sertifikat terbit
                      </p>
                    </div>
                  </div>
                  {e.lessons.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Belum ada materi video.</p>
                  ) : (
                    <ol className="mt-3 divide-y divide-gray-100 text-sm">
                      {e.lessons.map((l, idx) => (
                        <li key={l.id} className="flex items-start justify-between gap-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{idx + 1}. {l.title}</p>
                            {l.note && <p className="text-xs text-gray-500">{l.note}</p>}
                          </div>
                          {l.videoUrl && (
                            <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-medium text-brand hover:underline">
                              Buka video
                            </a>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </DataGate>
  );
}

