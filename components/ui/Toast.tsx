"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

const TOAST_EVENT = "bw:toast";

export const showToast = {
  success: (message: string) => dispatch(message, "success"),
  error: (message: string) => dispatch(message, "error"),
  info: (message: string) => dispatch(message, "info"),
};

function dispatch(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { id: Math.random().toString(36).slice(2, 9), message, type },
    })
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(e: Event) {
      const custom = e as CustomEvent<ToastItem>;
      if (!custom.detail?.message) return;
      const item: ToastItem = {
        id: custom.detail.id || Math.random().toString(36).slice(2, 9),
        message: custom.detail.message,
        type: custom.detail.type || "success",
      };
      setToasts((prev) => [...prev.slice(-4), item]); // Maksimal 5 toast sekaligus
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2.5 px-3 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3600);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  const borderColor = isSuccess
    ? "border-emerald-200"
    : isError
      ? "border-red-200"
      : "border-blue-200";

  const badgeBg = isSuccess
    ? "bg-emerald-50 text-emerald-700"
    : isError
      ? "bg-red-50 text-red-700"
      : "bg-blue-50 text-blue-700";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-md border ${borderColor} bg-white p-3.5 shadow-lg shadow-gray-900/5 transition-all animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badgeBg}`}>
        {isSuccess ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : isError ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-900 leading-snug">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="mt-0.5 -mr-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

