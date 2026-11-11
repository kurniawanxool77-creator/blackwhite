import { Link, useParams } from "react-router-dom";
import { QuizForm } from "@/components/user/QuizForm";
import { fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { submitQuiz } from "@/src/lib/actions/user";
import { useApiData } from "@/src/lib/api-client";

type QuizPayload = {
  registrationId: string;
  eventName: string;
  passScore: number;
  bestScore: number | null;
  blocked: boolean;
  videos: { done: number; total: number };
  questions: { id: string; text: string; options: string[] }[];
};

export function QuizPage() {
  const { id } = useParams();
  const state = useApiData<QuizPayload>(id ? `/api/user/ticket/${encodeURIComponent(id)}/quiz` : null);

  return (
    <DataGate state={state} notFoundTitle="Kuis tidak ditemukan" backTo="/dashboard">
      {({ registrationId, eventName, passScore, bestScore, blocked, videos, questions }) => {
        const ticketHref = `/tiket/${registrationId}`;
        return (
          <div className="mx-auto max-w-2xl space-y-6">
            <div>
              <Link to={ticketHref} className="text-sm text-gray-500 hover:text-brand">← Kembali ke tiket</Link>
              <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">Kuis evaluasi</h1>
              <p className="mt-1 text-sm text-gray-600">
                {eventName} · {fmtNum(questions.length)} soal · nilai lulus {passScore}%
                {bestScore !== null && ` · nilai terbaik Anda: ${bestScore}%`}
              </p>
            </div>

            {blocked ? (
              <div className="card border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-semibold">Selesaikan seluruh video materi terlebih dahulu</p>
                <p className="mt-1">Progres saat ini: {videos.done} dari {videos.total} materi selesai.</p>
                <Link to={ticketHref} className="btn btn-primary btn-sm mt-3">Lanjutkan materi</Link>
              </div>
            ) : (
              <QuizForm
                action={submitQuiz.bind(null, registrationId)}
                questions={questions}
                passScore={passScore}
                ticketHref={ticketHref}
              />
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

