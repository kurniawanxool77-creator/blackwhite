import { Link, useParams } from "react-router-dom";
import { QuizForm } from "@/components/user/QuizForm";
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
          <div className="mx-auto max-w-2xl space-y-4">
            <div>
              <Link to={ticketHref} className="text-sm text-gray-600 hover:text-gray-900">← Kembali ke tiket</Link>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900">Kuis · {eventName}</h1>
              <p className="text-sm text-gray-600">
                {questions.length} soal · nilai lulus {passScore}%
                {bestScore !== null && ` · nilai terbaik Anda ${bestScore}%`}
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

