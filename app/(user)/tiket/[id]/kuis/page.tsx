import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizForm } from "@/components/user/QuizForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { learningState, parseOptions } from "@/lib/learning";
import { submitQuiz } from "./actions";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: PageProps<"/tiket/[id]/kuis">) {
  const { id } = await params;
  const user = await requireUser();
  const reg = await db.registration.findFirst({
    where: { id, userId: user.id, status: "approved" },
    include: { event: { include: { questions: { orderBy: { order: "asc" } } } }, attempts: { orderBy: { score: "desc" }, take: 1 } },
  });
  if (!reg || reg.event.questions.length === 0) notFound();
  const best = reg.attempts[0];
  const { course, videos } = await learningState(reg.id);
  if (course && videos.done < videos.total) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href={`/tiket/${reg.id}`} className="text-sm text-gray-600 hover:text-gray-900">← Kembali ke tiket</Link>
        <p className="card p-6 text-center text-sm text-gray-700">Kuis terbuka setelah semua video selesai ditonton ({videos.done}/{videos.total}).</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href={`/tiket/${reg.id}`} className="text-sm text-gray-600 hover:text-gray-900">← Kembali ke tiket</Link>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Kuis · {reg.event.name}</h1>
        <p className="text-sm text-gray-600">
          {reg.event.questions.length} soal · nilai lulus {reg.event.passScore}%
          {best && ` · nilai terbaik Anda ${best.score}%`}
        </p>
      </div>
      {/* Kunci jawaban tidak ikut dikirim ke browser; hanya teks soal dan pilihan. */}
      <QuizForm
        action={submitQuiz.bind(null, reg.id)}
        questions={reg.event.questions.map((q) => ({ id: q.id, text: q.text, options: parseOptions(q.options) }))}
        passScore={reg.event.passScore}
        ticketHref={`/tiket/${reg.id}`}
      />
    </div>
  );
}
