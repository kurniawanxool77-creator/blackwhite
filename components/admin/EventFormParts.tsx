"use client";

// Bagian bernomor di form event agar isian panjang tetap rapi dan mudah dipindai.
export function Section({ no, title, hint, children }: { no: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200">
      <header className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{no}</span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {hint && <p className="text-xs text-gray-600">{hint}</p>}
        </div>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

// Input angka berformat ribuan, tanpa spinner.
export function NumInput({ id, value, onChange, placeholder, max }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number }) {
  return (
    <input
      id={id}
      name={id}
      className="input"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        onChange(raw ? Math.min(max ?? Infinity, Number(raw)).toLocaleString("id-ID") : "");
      }}
    />
  );
}

// Pilihan berbentuk kartu (radio), dipakai untuk jenis event, template, dan cara persetujuan.
export function ChoiceCards<T extends string>({ name, value, onChange, options, cols = 2 }: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint: string }[];
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-gray-200 bg-white p-3 text-sm has-checked:border-brand has-checked:bg-green-50/60">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 accent-brand" />
          <span>
            <span className="block font-semibold text-gray-900">{o.label}</span>
            <span className="mt-0.5 block text-xs text-gray-600">{o.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
