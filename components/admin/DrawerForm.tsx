"use client";

import { useState, useTransition } from "react";
import { showToast } from "@/components/ui/Toast";
import { errorMessage } from "@/src/lib/rpc";
import { useDrawer } from "./Drawer";

type Action = (f: FormData) => Promise<string | null | void>;

// Form untuk server action biasa di dalam Drawer: string = pesan error (drawer tetap terbuka), selain itu = berhasil → drawer ditutup.
export function DrawerForm({ action, submitLabel = "Simpan", children }: { action: Action; submitLabel?: string; children: React.ReactNode }) {
  const drawer = useDrawer();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      action={(f) =>
        start(async () => {
          setError(null);
          try {
            const result = await action(f);
            if (typeof result === "string" && result !== "Tersimpan.") {
              setError(result);
              showToast.error(result);
            } else {
              showToast.success("Perubahan berhasil disimpan.");
              drawer?.close();
            }
          } catch (err) {
            const msg = errorMessage(err);
            setError(msg);
            showToast.error(msg);
          }
        })
      }
      className="mt-4 space-y-3"
    >
      {children}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
