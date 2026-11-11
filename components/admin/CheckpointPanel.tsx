import type { Checkpoint } from "@prisma/client";
import { addCheckpoint, deleteCheckpoint, moveCheckpoint, setCheckpointAudience, sortRundown, toggleCheckpointScan, updateCheckpoint } from "@/src/lib/actions/events";
import { dayKey, fmtWhen } from "@/lib/schedule";
import { Drawer } from "./Drawer";
import { DrawerForm } from "./DrawerForm";
import { CHECKPOINT_KIND, fmtNum } from "@/lib/format";
import type { FormField } from "@/lib/registration-form";
import { audienceLabel, choiceOptions, parseAudience } from "@/lib/rundown";

type Props = {
  eventId: string;
  eligible: Record<string, number>; // peserta disetujui yang termasuk tiap item
  checkpoints: (Checkpoint & { _count: { scans: number } })[];
  fields: FormField[]; // formulir pendaftaran: sumber pilihan "khusus untuk"
  defaultDate?: string; // tanggal awal untuk item baru (YYYY-MM-DD, hari pertama event)
  readOnly?: boolean; // tampilan panitia
};

// Untuk siapa item rundown: semua peserta, atau hanya yang memilih jawaban tertentu (mis. Paket Lengkap).
function AudienceCell({ c, fields, readOnly }: { c: Checkpoint; fields: FormField[]; readOnly?: boolean }) {
  const label = audienceLabel(c);
  const text = <span className={`text-xs ${label ? "font-medium text-amber-800" : "text-gray-500"}`}>{label ? `Khusus ${label}` : "Semua peserta"}</span>;
  const options = choiceOptions(fields);
  if (readOnly || options.length === 0) return text;
  const chosen = new Set(parseAudience(c.audience));
  return (
    <details className="group">
      <summary className="cursor-pointer list-none">{text} <span className="text-xs text-brand group-open:hidden">· ubah</span></summary>
      <form action={setCheckpointAudience.bind(null, c.id)} className="mt-2 w-64 space-y-1.5 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-xs text-gray-600">Centang jawaban peserta yang ikut item ini. Kosongkan semua = semua peserta.</p>
        {options.map((o) => (
          <label key={o.key} className="flex items-start gap-2 text-xs text-gray-800">
            <input type="checkbox" name="audience" value={o.key} defaultChecked={chosen.has(o.key)} className="mt-0.5 accent-brand" />
            <span><span className="text-gray-500">{o.field}:</span> {o.value}</span>
          </label>
        ))}
        <button className="btn btn-primary btn-sm mt-1 w-full">Simpan</button>
      </form>
    </details>
  );
}

type CpValues = { name?: string; kind?: string; date?: string; startTime?: string; endTime?: string; place?: string; description?: string };
const toInput = (t?: string) => (t ? t.replace(".", ":") : ""); // "07.30" → "07:30" untuk <input type="time">

function CheckpointFields({ name, kind, date, startTime, endTime, place, description }: CpValues) {
  return (
    <>
      <div>
        <label className="label" htmlFor="cp-name">Nama item</label>
        <input id="cp-name" name="name" defaultValue={name} placeholder="mis. Makan siang hari 2" className="input" required maxLength={120} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className="label" htmlFor="cp-date">Tanggal</label>
          <input id="cp-date" name="date" type="date" defaultValue={date} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-start">Mulai (WIB)</label>
          <input id="cp-start" name="startTime" type="time" defaultValue={toInput(startTime)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-end">Selesai</label>
          <input id="cp-end" name="endTime" type="time" defaultValue={toInput(endTime)} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="cp-place">Tempat</label>
        <input id="cp-place" name="place" defaultValue={place} placeholder="mis. Lobi Hotel Patra" className="input" maxLength={120} />
      </div>
      <div>
        <label className="label" htmlFor="cp-desc">Deskripsi</label>
        <textarea id="cp-desc" name="description" defaultValue={description} rows={3} placeholder="Apa yang terjadi di pos ini dan apa yang perlu dibawa/ditunjukkan peserta." className="input" maxLength={600} />
      </div>
      <div>
        <label className="label" htmlFor="cp-kind">Jenis</label>
        <select id="cp-kind" name="kind" defaultValue={kind ?? "attendance"} className="input">
          {Object.entries(CHECKPOINT_KIND).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
    </>
  );
}

export function CheckpointPanel({ eventId, eligible, checkpoints, fields, defaultDate, readOnly }: Props) {
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-gray-900">Rundown & checkpoint</h2>
          <p className="text-xs text-gray-500">
            Hanya item &quot;Perlu scan&quot; yang muncul di scanner. Item &quot;Khusus&quot; hanya masuk rundown peserta dengan jawaban itu, dan peserta lain ditolak saat scan.
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-1.5">
          {checkpoints.length > 1 && (
            <form action={sortRundown.bind(null, eventId)}>
              <button className="btn btn-secondary btn-sm" title="Susun ulang urutan sesuai tanggal dan jam mulai">Urutkan menurut jadwal</button>
            </form>
          )}
          <Drawer label="+ Tambah item" title="Tambah item rundown" variant="secondary">
            <DrawerForm action={addCheckpoint.bind(null, eventId)} submitLabel="Tambah">
              <CheckpointFields date={defaultDate} />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="scan" defaultChecked className="h-4 w-4 accent-brand" />
                Perlu scan
              </label>
            </DrawerForm>
          </Drawer>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Checkpoint</th>
              <th>Jenis</th>
              <th>Untuk</th>
              <th>Scan</th>
              <th className="w-56">Progres</th>
              {!readOnly && <th />}
            </tr>
          </thead>
          <tbody>
            {checkpoints.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="text-center text-gray-500">Belum ada item rundown.</td>
              </tr>
            )}
            {checkpoints.map((c, i) => {
              const of = eligible[c.id] ?? 0;
              const pct = of ? Math.round((c._count.scans / of) * 100) : 0;
              return (
                <tr key={c.id} className="align-top">
                  <td className="text-gray-500">{i + 1}</td>
                  <td>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    {(c.date || c.startTime || c.place) && <p className="text-xs text-brand">{[fmtWhen(c.date, c.startTime, c.endTime), c.place].filter(Boolean).join(" · ")}</p>}
                    {c.description && <p className="mt-0.5 max-w-xs text-xs text-gray-500">{c.description}</p>}
                  </td>
                  <td className="text-gray-600">{CHECKPOINT_KIND[c.kind]}</td>
                  <td><AudienceCell c={c} fields={fields} readOnly={readOnly} /></td>
                  <td className="whitespace-nowrap">
                    {readOnly || (c.scan && c._count.scans > 0) ? (
                      <span className={`text-xs font-medium ${c.scan ? "text-green-700" : "text-gray-500"}`}>{c.scan ? "Perlu scan" : "Agenda saja"}</span>
                    ) : (
                      <form action={toggleCheckpointScan.bind(null, c.id)}>
                        <button
                          className={`btn btn-sm ${c.scan ? "border-green-200 bg-green-50 text-green-800" : "btn-secondary text-gray-600"}`}
                          title={c.scan ? "Klik untuk jadikan agenda saja" : "Klik untuk wajibkan scan"}
                        >
                          {c.scan ? "Perlu scan" : "Agenda saja"}
                        </button>
                      </form>
                    )}
                  </td>
                  <td>
                    {c.scan ? (
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded bg-gray-100">
                          <div className="h-1.5 rounded bg-brand" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="w-20 text-right text-xs whitespace-nowrap text-gray-700 tabular-nums">
                          {fmtNum(c._count.scans)} / {fmtNum(of)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Tidak dipindai</span>
                    )}
                  </td>
                  {!readOnly && <td className="whitespace-nowrap text-right">
                    <div className="inline-flex gap-1">
                    <Drawer label="Ubah" title="Ubah item rundown" variant="secondary">
                      <DrawerForm action={updateCheckpoint.bind(null, c.id)}>
                        <CheckpointFields name={c.name} kind={c.kind} date={c.date ? dayKey(c.date) : ""} startTime={c.startTime} endTime={c.endTime} place={c.place} description={c.description} />
                      </DrawerForm>
                    </Drawer>
                    <form className="inline-flex gap-1">
                      <button formAction={moveCheckpoint.bind(null, c.id, "up")} className="btn btn-secondary btn-sm" disabled={i === 0} aria-label="Naikkan">↑</button>
                      <button formAction={moveCheckpoint.bind(null, c.id, "down")} className="btn btn-secondary btn-sm" disabled={i === checkpoints.length - 1} aria-label="Turunkan">↓</button>
                      {c._count.scans === 0 && (
                        <button formAction={deleteCheckpoint.bind(null, c.id)} className="btn btn-danger btn-sm">Hapus</button>
                      )}
                    </form>
                    </div>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
