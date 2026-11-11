import { VideoPlayer } from "@/components/user/VideoPlayer";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { youtubeId } from "@/lib/learning";

export const dynamic = "force-dynamic";

// Materi video, jumlah soal kuis, dan sertifikat dari pelatihan yang ditugaskan (diisi Superadmin).
export default async function AdminMateriPage() {
  const admin = await requireAdmin("scanner");
  const events = await db.event.findMany({
    where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
    orderBy: { startDate: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" } },
      _count: { select: { questions: true, registrations: { where: { certificateNo: { not: null } } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Materi pelatihan</h1>
        <p className="text-sm text-gray-600">Video materi, kuis, dan sertifikat di pelatihan yang Anda pegang.</p>
      </div>

      {events.length === 0 && <p className="card p-6 text-center text-sm text-gray-500">Belum ada pelatihan yang ditugaskan kepada Anda.</p>}

      {events.map((ev) => (
        <section key={ev.id} className="card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3">
            <div>
              <h2 className="font-semibold text-gray-900">{ev.name}</h2>
              <p className="text-xs text-gray-500">{ev.location} · {fmtDate(ev.startDate)}</p>
            </div>
            <p className="text-xs text-gray-600">
              {ev._count.questions ? `Kuis ${ev._count.questions} soal · lulus ≥ ${ev.passScore}%` : "Tanpa kuis"}
              {ev.certificate && ` · ${ev._count.registrations} sertifikat terbit`}
            </p>
          </div>
          {ev.lessons.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500">Belum ada materi video.</p>
          ) : (
            <ol className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {ev.lessons.map((l, i) => {
                const vid = youtubeId(l.videoUrl);
                return (
                  <li key={l.id} className="min-w-0">
                    {vid && <VideoPlayer id={vid} title={l.title} />}
                    <p className="mt-2 text-sm font-semibold text-gray-900">{i + 1}. {l.title}</p>
                    {l.note && <p className="text-xs text-gray-600">{l.note}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
