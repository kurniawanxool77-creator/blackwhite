"use client";

import { useTransition } from "react";
import { EVENT_STATUS } from "@/lib/format";

type Props = {
  status: string;
  action: (formData: FormData) => Promise<void>;
};

export function EventStatusSelect({ status, action }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative inline-flex items-center">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const val = e.target.value;
          startTransition(async () => {
            const fd = new FormData();
            fd.set("status", val);
            await action(fd);
          });
        }}
        aria-label="Ubah status pendaftaran event"
        className={`cursor-pointer rounded-md border py-1.5 pl-2.5 pr-7 text-xs font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-brand focus:outline-none ${
          status === "open"
            ? "border-green-300 bg-green-50 text-green-800 hover:bg-green-100/80"
            : status === "closed"
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100/80"
            : status === "done"
            ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100/80"
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
  );
}
