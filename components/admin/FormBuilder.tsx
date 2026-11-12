"use client";

import { useActionState, useState } from "react";
import { FIELD_PRESETS } from "@/lib/event-types";
import { fmtNum } from "@/lib/format";
import { FIELD_GROUPS, type FieldGroup, type FormField } from "@/lib/registration-form";
import { FormFieldEditor } from "./FormFieldEditor";

type Action = (prev: string | null, formData: FormData) => Promise<string | null>;

const uid = () => Math.random().toString(36).slice(2, 10);

export function FormBuilder({ action, defaultValue }: { action: Action; defaultValue: FormField[] }) {
  const [message, formAction, pending] = useActionState(action, null);
  const [fields, setFields] = useState(defaultValue);
  const [groupFilter, setGroupFilter] = useState<"all" | FieldGroup>("all");
  const [showPresets, setShowPresets] = useState(defaultValue.length === 0);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultValue.slice(0, defaultValue.length > 4 ? 1 : defaultValue.length).map((f) => f.id))
  );

  const savedJson = JSON.stringify(defaultValue);
  const [prevSaved, setPrevSaved] = useState(savedJson);
  if (prevSaved !== savedJson) {
    setPrevSaved(savedJson);
    setFields(defaultValue);
  }

  const isDirty = JSON.stringify(fields) !== savedJson;
  const visible = fields
    .map((field, index) => ({ field, index }))
    .filter((item) => groupFilter === "all" || item.field.group === groupFilter);

  const toggleOne = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const add = () => {
    const id = uid();
    const targetGroup: FieldGroup = groupFilter === "all" ? "umum" : groupFilter;
    setFields((list) => [...list, { id, label: "", type: "text", group: targetGroup, required: true, options: [], hint: "" }]);
    setExpanded((prev) => new Set(prev).add(id));
  };

  const addMany = (items: Omit<FormField, "id">[]) => {
    const created = items.map((f) => ({ ...f, id: uid() }));
    setFields((list) => [...list, ...created]);
    setGroupFilter("all");
    setExpanded((prev) => {
      const next = new Set(prev);
      created.forEach((f) => next.add(f.id));
      return next;
    });
  };

  const updateAt = (index: number, patch: Partial<FormField>) => {
    setFields((list) => list.map((f, j) => (j === index ? { ...f, ...patch } : f)));
  };

  const moveAt = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    setFields((list) => {
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const removeAt = (index: number, id: string) => {
    setFields((list) => list.filter((_, j) => j !== index));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const allExpanded = visible.length > 0 && visible.every((v) => expanded.has(v.field.id));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="formFields" value={JSON.stringify(fields)} />

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-gray-800">{fmtNum(fields.length)} isian formulir</span>
          {isDirty && (
            <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
              Perubahan belum disimpan
            </span>
          )}
          {message && (
            <span className={`font-medium ${message === "Tersimpan." ? "text-green-700" : "text-red-700"}`}>
              {message}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visible.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (allExpanded) visible.forEach((v) => next.delete(v.field.id));
                  else visible.forEach((v) => next.add(v.field.id));
                  return next;
                })
              }
            >
              {allExpanded ? "Tutup semua" : "Buka semua"}
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPresets((s) => !s)}>
            {showPresets ? "Sembunyikan template" : "+ Tambah dari template"}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={add}>
            + Tambah isian
          </button>
          <button className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan formulir"}
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-700">Template isian cepat</p>
            <p className="text-xs text-gray-500">Klik untuk langsung menambahkan paket pertanyaan siap pakai.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FIELD_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => addMany(p.fields)}
                className="flex flex-col items-start rounded-md border border-gray-200 bg-white px-3 py-2 text-left hover:border-brand hover:bg-green-50/40 transition"
              >
                <span className="text-xs font-semibold text-gray-900">+ {p.label}</span>
                <span className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">
                  {p.fields.map((x) => x.label).join(", ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter kelompok formulir">
          <button
            type="button"
            onClick={() => setGroupFilter("all")}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              groupFilter === "all"
                ? "border-brand bg-green-50 text-brand"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Semua ({fmtNum(fields.length)})
          </button>
          {Object.entries(FIELD_GROUPS).map(([k, label]) => {
            const count = fields.filter((f) => f.group === k).length;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setGroupFilter(k as FieldGroup)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  groupFilter === k
                    ? "border-brand bg-green-50 text-brand"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label} ({fmtNum(count)})
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          {fields.length === 0
            ? "Belum ada isian tambahan. Hanya nama, email, dan No. WhatsApp yang diminta. Klik \"+ Tambah isian\" atau pilih dari template di atas."
            : "Tidak ada isian pada kelompok ini."}
        </p>
      ) : (
        <div className="space-y-2.5">
          {visible.map(({ field, index }) => (
            <FormFieldEditor
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              expanded={expanded.has(field.id)}
              onToggle={() => toggleOne(field.id)}
              onChange={(patch) => updateAt(index, patch)}
              onMove={(delta) => moveAt(index, delta)}
              onRemove={() => removeAt(index, field.id)}
            />
          ))}
        </div>
      )}

      {visible.length > 4 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <button type="button" className="btn btn-secondary" onClick={add}>+ Tambah isian</button>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan formulir"}</button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Isian tanpa judul, atau pilihan tanpa opsi, tidak disimpan. Mengubah formulir tidak mengubah jawaban peserta yang sudah mendaftar.
      </p>
    </form>
  );
}
