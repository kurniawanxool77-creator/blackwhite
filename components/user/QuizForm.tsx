"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { QuizResult } from "@/app/(user)/tiket/[id]/kuis/actions";

type Question = { id: string; text: string; options: string[] };
type Action = (prev: QuizResult, f: FormData) => Promise<QuizResult>;

export function QuizForm({ action, questions, passScore, ticketHref }: { action: Action; questions: Question[]; passScore: number; ticketHref: string }) {
  const [result, run, pending] = useActionState(action, null);

  if (result && !result.message) {
    return (
      <section className={`card p-6 text-center ${result.passed ? "border-green-300" : "border-amber-300"}`}>
        <p className="text-sm text-gray-600">Nilai Anda</p>
        <p className={`mt-1 text-5xl font-bold tabular-nums ${result.passed ? "text-green-700" : "text-amber-700"}`}>{result.score}%</p>
        <p className="mt-2 text-sm text-gray-700">{result.correct} dari {result.total} jawaban benar · nilai lulus {passScore}%</p>
        <p className={`mt-3 font-semibold ${result.passed ? "text-green-700" : "text-amber-700"}`}>{result.passed ? "Selamat, Anda lulus!" : "Belum lulus. Pelajari lagi materinya lalu coba kembali."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {result.certificateNo && <Link href={`/sertifikat/${result.certificateNo}`} target="_blank" className="btn btn-primary">Lihat sertifikat</Link>}
          {!result.passed && <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">Coba lagi</button>}
          <Link href={ticketHref} className="btn btn-secondary">Kembali ke tiket</Link>
        </div>
      </section>
    );
  }

  return (
    <form action={run} className="space-y-4">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="card p-5">
          <legend className="sr-only">Soal {i + 1}</legend>
          <p className="font-medium text-gray-900">{i + 1}. {q.text}</p>
          <div className="mt-3 space-y-2">
            {q.options.map((o, j) => (
              <label key={j} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 text-sm text-gray-800 has-checked:border-brand has-checked:bg-green-50/60">
                <input type="radio" name={`q_${q.id}`} value={j} required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
                <span><span className="font-semibold text-gray-500">{String.fromCharCode(65 + j)}.</span> {o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {result?.message && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{result.message}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menilai..." : "Kirim jawaban"}</button>
    </form>
  );
}
