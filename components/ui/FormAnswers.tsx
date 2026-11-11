import type { Answer } from "@/lib/registration-form";

type Props = {
  answers: Answer[];
  title?: string;
  id?: string; // jangkar tautan, mis. #kesehatan dari badge di daftar peserta
  tone?: "danger"; // bagian yang perlu perhatian (kondisi kesehatan)
  empty?: string; // pesan bila tidak ada jawaban; tanpa ini bagian disembunyikan
};

// Jawaban formulir pendaftaran: judul isian + jawaban; foto tampil sebagai gambar kecil yang bisa dibuka.
export function FormAnswers({ answers, title = "Data pendaftaran", id, tone, empty }: Props) {
  if (answers.length === 0 && !empty) return null;
  const danger = tone === "danger" && answers.length > 0;
  return (
    <section id={id} className={`card scroll-mt-20 ${danger ? "border-red-300" : ""}`}>
      <h2 className={`border-b px-5 py-3 font-semibold ${danger ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 text-gray-900"}`}>{title}</h2>
      {answers.length === 0 ? (
        <p className="px-5 py-3 text-sm text-gray-600">{empty}</p>
      ) : (
        <dl className="divide-y divide-gray-100">
          {answers.map((a) => (
            <div key={a.id} className="grid gap-1 px-5 py-2.5 text-sm sm:grid-cols-[14rem_1fr] sm:gap-4">
              <dt className="text-gray-600">{a.label}</dt>
              <dd className="font-medium break-words whitespace-pre-line text-gray-900">
                {a.type === "file" ? (
                  <a href={a.value} target="_blank" rel="noreferrer" className="inline-block">
                    <img src={a.value} alt={a.label} className="h-20 w-20 rounded-md border border-gray-200 object-cover" />
                  </a>
                ) : a.type === "checkbox" ? (
                  <span className="text-green-700">✓ Disetujui</span>
                ) : (
                  a.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
