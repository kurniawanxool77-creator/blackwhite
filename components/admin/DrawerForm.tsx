"use client";

import { useState, useTransition } from "react";
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
          const result = await action(f);
          if (typeof result === "string" && result !== "Tersimpan.") setError(result);
          else drawer?.close();
        })
      }
      className="mt-4 space-y-3"
    >
      {children}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menyimpan..." : submitLabel}</button>
    </form>
  );
}
