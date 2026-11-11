"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";

// Panel geser dari kanan untuk form Tambah / Ubah. Form di dalamnya memanggil useDrawer()?.close() setelah berhasil.
const DrawerContext = createContext<{ close: () => void } | null>(null);
export const useDrawer = () => useContext(DrawerContext);

type Props = {
  label: React.ReactNode; // isi tombol pembuka
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "link";
  size?: "md" | "lg";
};

const TRIGGER = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary btn-sm",
  link: "text-sm font-medium text-brand hover:underline",
};

export function Drawer({ label, title, children, variant = "primary", size = "md" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={TRIGGER[variant]}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-gray-900/40" onClick={() => setOpen(false)} />
          <aside className={`animate-rise absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-xl ${size === "lg" ? "max-w-2xl" : "max-w-md"}`}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100">
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <DrawerContext.Provider value={{ close: () => setOpen(false) }}>{children}</DrawerContext.Provider>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

