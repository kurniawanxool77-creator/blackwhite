"use client";

import { useActionState, useRef, useState } from "react";
import { showToast } from "@/components/ui/Toast";
import { useDrawer } from "./Drawer";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;

// Form yang dikosongkan dan panelnya ditutup setelah berhasil disimpan.
function useSavingForm(action: Action, successMsg = "Data berhasil disimpan.") {
  const drawer = useDrawer();
  const form = useRef<HTMLFormElement>(null);
  const [error, run, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await action(prev, f);
    if (!result) {
      form.current?.reset();
      showToast.success(successMsg);
      drawer?.close();
    } else {
      showToast.error(result);
    }
    return result;
  }, null);
  return { form, error, run, pending };
}

// lesson diisi = mode ubah (action sudah terikat ke id materi).
export function LessonForm({ action, lesson }: { action: Action; lesson?: { title: string; videoUrl: string; note: string } }) {
  const { form, error, run, pending } = useSavingForm(
    action,
    lesson ? "Materi video berhasil diperbarui." : "Materi video berhasil ditambahkan."
  );
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
      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : lesson ? "Simpan perubahan" : "Tambah materi"}
      </button>
    </form>
  );
}

// question diisi = mode ubah. Pilihan jawaban terstruktur per baris dengan radio kunci jawaban.
export function QuestionForm({ action, question }: { action: Action; question?: { text: string; options: string[]; answer: number } }) {
  const { form, error, run, pending } = useSavingForm(
    action,
    question ? "Soal kuis berhasil diperbarui." : "Soal kuis berhasil ditambahkan."
  );
  const [options, setOptions] = useState<string[]>(
    question?.options && question.options.length >= 2
      ? question.options
      : ["", "", "", ""]
  );
  const [answerIdx, setAnswerIdx] = useState<number>(question?.answer ?? 0);

  const updateOpt = (i: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[i] = val;
      return copy;
    });
  };

  const addOpt = () => {
    if (options.length < 6) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const removeOpt = (i: number) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, idx) => idx !== i));
      if (answerIdx === i) setAnswerIdx(0);
      else if (answerIdx > i) setAnswerIdx((prev) => prev - 1);
    }
  };

  return (
    <form ref={form} action={run} className="mt-4 space-y-4">
      <div>
        <label className="label" htmlFor="q-text">Pertanyaan</label>
        <textarea
          id="q-text"
          name="text"
          className="input"
          rows={3}
          defaultValue={question?.text}
          placeholder="Tuliskan pertanyaan soal..."
          required
          maxLength={500}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Pilihan Jawaban</label>
          <span className="text-[11px] text-gray-500">Pilih bulatan untuk kunci jawaban benar</span>
        </div>

        <div className="space-y-2">
          {options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = answerIdx === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 p-1.5 rounded-md border transition ${
                  isCorrect
                    ? "border-brand bg-emerald-50/50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <label
                  className="flex items-center gap-1.5 pl-1.5 cursor-pointer shrink-0"
                  title="Tandai sebagai kunci jawaban benar"
                >
                  <input
                    type="radio"
                    name="answer_radio"
                    checked={isCorrect}
                    onChange={() => setAnswerIdx(i)}
                    className="h-4 w-4 accent-brand cursor-pointer"
                  />
                  <span className={`text-xs font-bold w-4 text-center ${isCorrect ? "text-brand" : "text-gray-500"}`}>
                    {letter}.
                  </span>
                </label>

                <input
                  type="text"
                  name="opt"
                  value={opt}
                  onChange={(e) => updateOpt(i, e.target.value)}
                  placeholder={`Isi pilihan ${letter}...`}
                  className="input min-h-8 text-xs sm:min-h-8 sm:py-1 flex-1 border-0 bg-transparent focus:ring-0 focus:border-0 shadow-none px-1"
                  required
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpt(i)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-red-600 text-xs shrink-0"
                    title="Hapus pilihan ini"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {options.length < 6 && (
          <button
            type="button"
            onClick={addOpt}
            className="mt-2 text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
          >
            + Tambah Pilihan Jawaban
          </button>
        )}

        {/* Hidden inputs for form submission compatibility */}
        <input type="hidden" name="answer" value={answerIdx + 1} />
        <input type="hidden" name="options" value={options.join("\n")} />
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2.5">{error}</p>}
      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : question ? "Simpan perubahan" : "Tambah soal"}
      </button>
    </form>
  );
}
