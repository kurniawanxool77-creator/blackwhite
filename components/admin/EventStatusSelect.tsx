"use client";

import { useState, useTransition } from "react";
import { EVENT_STATUS } from "@/lib/format";

type Props = {
  status: string;
  action: (formData: FormData) => Promise<void>;
};

export function EventStatusSelect({ status, action }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="relative inline-flex items-center">
        <select
          key={status}
          defaultValue={status}
          disabled={isPending}
          onChange={(e) => {
            const val = e.target.value;
            setError(null);
            startTransition(async () => {
              try {
                const fd = new FormData();
                fd.set("status", val);
                await action(fd);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal mengubah status.");
              }
            });
          }}
          aria-label="Ubah status pendaftaran event"
          className={`cursor-pointer rounded-md border py-1.5 pl-2.5 pr-7 text-xs font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-brand focus:outline-none ${
            status === "open"
              ? "border-green-300 bg-green-50 text-green-800 hover:border-green-400"
              : status === "closed"
              ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400"
              : status === "done"
              ? "border-slate-300 bg-slate-50 text-slate-800 hover:border-slate-400"
              : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          } ${isPending ? "opacity-60 cursor-wait" : ""}`}
        >
          {Object.entries(EVENT_STATUS).map(([value, label]) => (
            <option key={value} value={value} className="bg-white text-gray-900">
              {label}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="pointer-events-none absolute right-2 h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        )}
      </div>
      {error && <p className="text-[11px] text-red-700">{error}</p>}
    </div>
  );
}
