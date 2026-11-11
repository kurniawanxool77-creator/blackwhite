"use client";

import { useActionState, useRef } from "react";
import { useDrawer } from "./Drawer";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;

// Form yang dikosongkan dan panelnya ditutup setelah berhasil disimpan.
function useSavingForm(action: Action) {
  const drawer = useDrawer();
  const form = useRef<HTMLFormElement>(null);
  const [error, run, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await action(prev, f);
    if (!result) {
      form.current?.reset();
      drawer?.close();
    }
    return result;
  }, null);
  return { form, error, run, pending };
}

// lesson diisi = mode ubah (action sudah terikat ke id materi).
export function LessonForm({ action, lesson }: { action: Action; lesson?: { title: string; videoUrl: string; note: string } }) {
  const { form, error, run, pending } = useSavingForm(action);
  return (
    <form ref={form} action={run} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="l-title">Judul materi</label>
        <input id="l-title" name="title" className="input" defaultValue={lesson?.title} placeholder="mis. Pengenalan K3" required maxLength={160} />
      </div>
      <div>
        <label className="label" htmlFor="l-url">Tautan YouTube</label>
        <input id="l-url" name="videoUrl" className="input" defaultValue={lesson?.videoUrl} placeholder="https://youtu.be/xxxxxxxxxxx" required inputMode="url" />
      </div>
      <div>
        <label className="label" htmlFor="l-note">Keterangan (opsional)</label>
        <textarea id="l-note" name="note" className="input" rows={3} defaultValue={lesson?.note} maxLength={500} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menyimpan..." : lesson ? "Simpan perubahan" : "Tambah materi"}</button>
    </form>
  );
}

// question diisi = mode ubah. options satu per baris; answer = nomor jawaban benar (mulai 1).
export function QuestionForm({ action, question }: { action: Action; question?: { text: string; options: string[]; answer: number } }) {
  const { form, error, run, pending } = useSavingForm(action);
  return (
    <form ref={form} action={run} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="q-text">Pertanyaan</label>
        <textarea id="q-text" name="text" className="input" rows={3} defaultValue={question?.text} required maxLength={500} />
      </div>
      <div>
        <label className="label" htmlFor="q-options">Pilihan jawaban (satu per baris, 2–6)</label>
        <textarea id="q-options" name="options" className="input" rows={5} defaultValue={question?.options.join("\n")} placeholder={"Keselamatan dan Kesehatan Kerja\nKebersihan, Keamanan, Ketertiban"} required />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-700" htmlFor="q-answer">Jawaban benar nomor</label>
        <input id="q-answer" name="answer" className="input w-20" inputMode="numeric" defaultValue={question ? question.answer + 1 : 1} required />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menyimpan..." : question ? "Simpan perubahan" : "Tambah soal"}</button>
    </form>
  );
}
