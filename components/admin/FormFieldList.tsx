import { FIELD_GROUPS, FIELD_TYPES, parsePackage, type FormField } from "@/lib/registration-form";
import { fmtRupiah } from "@/lib/format";

// Ringkasan isi formulir pendaftaran (hanya baca) untuk panitia: apa saja yang diisi peserta saat mendaftar.
export function FormFieldList({ fields }: { fields: FormField[] }) {
  return (
    <details className="card">
      <summary className="cursor-pointer px-5 py-3 font-semibold text-gray-900">
        Syarat & formulir pendaftaran <span className="font-normal text-gray-500">· {fields.length ? `${fields.length + 1} isian` : "daftar cepat"}</span>
      </summary>
      <ol className="divide-y divide-gray-100 border-t border-gray-200 text-sm">
        <li className="flex items-start gap-3 px-5 py-2.5">
          <span className="w-5 shrink-0 text-xs text-gray-500 tabular-nums">–</span>
          <span className="text-gray-900">Nama, email (dari akun) & No. WhatsApp <span className="text-red-600">*</span></span>
        </li>
        {fields.map((f, i) => (
          <li key={f.id} className="flex items-start gap-3 px-5 py-2.5">
            <span className="w-5 shrink-0 text-xs text-gray-500 tabular-nums">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-gray-900">
                {f.label}
                {f.required && <span className="text-red-600"> *</span>}
                <span className="ml-2 text-xs text-gray-500">{FIELD_TYPES[f.type]} · {FIELD_GROUPS[f.group]}</span>
              </p>
              {f.options.length > 0 && (
                <p className="mt-0.5 text-xs text-gray-600">
                  {f.options.map((o) => (f.type === "package" ? `${parsePackage(o).name} (${fmtRupiah(parsePackage(o).price)})` : o)).join(" · ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-gray-200 px-5 py-2.5 text-xs text-gray-500"><span className="text-red-600">*</span> wajib diisi</p>
    </details>
  );
}
