"use client";

import { useActionState } from "react";
import { parseOptions } from "@/lib/certificate";
import { submitQuiz, type QuizResult } from "@/src/lib/actions/user";

type Question = { id: string; text: string; options: string };

export function CourseQuizInline({
  registrationId,
  questions,
  passScore,
  best,
  onPassed,
}: {
  registrationId: string;
  questions: Question[];
  passScore: number;
  best: { score: number; passed: boolean } | null;
  onPassed?: () => void;
}) {
  const [result, run, pending] = useActionState(async (_prev: QuizResult, f: FormData) => {
    const res = await submitQuiz(registrationId, null, f);
    if (res?.passed) {
      onPassed?.();
    }
    return res;
  }, null);

  const parsedQuestions = questions.map((q) => ({
    ...q,
    opts: parseOptions(q.options),
  }));

  return (
    <div className="card p-3.5 sm:p-6 space-y-4 sm:space-y-6">
      <div className="border-b border-gray-100 pb-3 sm:pb-4">
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-brand uppercase">
          Evaluasi Kelulusan
        </span>
        <h3 className="mt-0.5 text-base sm:text-xl font-bold text-gray-900">
          Kuis & Ujian Pemahaman
        </h3>
        <p className="mt-1 text-[11px] sm:text-xs text-gray-600">
          Terdapat {questions.length} butir soal pilihan ganda · Nilai kelulusan minimal {passScore}%.
          {best && (
            <span className={`ml-1 font-semibold ${best.passed ? "text-emerald-700" : "text-amber-700"}`}>
              Nilai terbaik Anda: {best.score}% {best.passed ? "(Lulus)" : "(Belum Lulus)"}.
            </span>
          )}
        </p>
      </div>

      {result && !result.message ? (
        <div className={`rounded-md border p-4 sm:p-6 text-center ${result.passed ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-600">Nilai Ujian Anda</p>
          <p className={`mt-1 text-4xl sm:text-5xl font-extrabold tabular-nums ${result.passed ? "text-emerald-700" : "text-amber-700"}`}>
            {result.score}%
          </p>
          <p className="mt-1.5 text-[11px] sm:text-xs text-gray-700">
            {result.correct} dari {result.total} jawaban benar · Nilai lulus {passScore}%
          </p>
          <p className={`mt-2.5 text-xs sm:text-sm font-bold ${result.passed ? "text-emerald-800" : "text-amber-800"}`}>
            {result.passed
              ? "🎉 Selamat, Anda dinyatakan LULUS!"
              : "Belum lulus. Silakan pelajari kembali materinya dan coba lagi."}
          </p>
          <div className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-2.5">
            {result.passed && onPassed && (
              <button
                type="button"
                onClick={onPassed}
                className="btn btn-primary btn-sm text-xs font-semibold"
              >
                Lanjut ke Sertifikat Kelulusan →
              </button>
            )}
            {!result.passed && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-primary btn-sm text-xs"
              >
                Coba Kerjakan Lagi
              </button>
            )}
          </div>
        </div>
      ) : (
        <form action={run} className="space-y-3.5 sm:space-y-4">
          {parsedQuestions.map((q, i) => (
            <fieldset key={q.id} className="rounded-md border border-gray-200 bg-white p-3 sm:p-4">
              <legend className="sr-only">Soal {i + 1}</legend>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                {i + 1}. {q.text}
              </p>
              <div className="mt-2.5 space-y-1.5 sm:space-y-2">
                {q.opts.map((opt, j) => {
                  const letter = String.fromCharCode(65 + j);
                  return (
                    <label
                      key={j}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md border border-gray-200 p-2 sm:p-2.5 text-xs text-gray-800 transition hover:bg-gray-50 has-checked:border-brand has-checked:bg-emerald-50/50 font-medium leading-relaxed"
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={j}
                        required
                        className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 accent-brand"
                      />
                      <span>
                        <span className="font-bold text-gray-500 mr-1">{letter}.</span> {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {result?.message && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              {result.message}
            </p>
          )}

          <div className="pt-1">
            <button className="btn btn-primary btn-sm sm:btn-md w-full text-xs sm:text-sm" disabled={pending}>
              {pending ? "Menilai jawaban kuis..." : "Kirim Jawaban Kuis"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
