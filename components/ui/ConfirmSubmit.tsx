"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { showToast } from "./Toast";

export type ConfirmVariant = "danger" | "primary" | "warning";

export type ConfirmSubmitProps = {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  successMessage?: string;
  variant?: ConfirmVariant;
  className?: string;
  disabled?: boolean;
  titleAttr?: string;
  children: React.ReactNode;
  onConfirm?: () => Promise<void | unknown> | void;
};

export function ConfirmSubmit({
  message,
  title,
  confirmText,
  cancelText = "Batal",
  loadingText,
  successMessage,
  variant = "danger",
  className,
  disabled,
  titleAttr,
  children,
  onConfirm,
}: ConfirmSubmitProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const defaultTitle = variant === "danger" ? "Konfirmasi Hapus" : "Konfirmasi Tindakan";
  const defaultConfirmText = variant === "danger" ? "Ya, Hapus" : "Ya, Lanjutkan";
  const defaultLoadingText = variant === "danger" ? "Menghapus..." : "Memproses...";

  const finalTitle = title || defaultTitle;
  const finalConfirmText = confirmText || defaultConfirmText;
  const finalLoadingText = loadingText || defaultLoadingText;

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading]);

  async function handleConfirm() {
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        const form = btnRef.current?.closest("form");
        if (form) {
          form.requestSubmit();
          // Give brief moment for form action transition
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      showToast.success(
        successMessage || (variant === "danger" ? "Data berhasil dihapus." : "Berhasil disimpan.")
      );
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses.";
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const modal = open && typeof document !== "undefined"
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-md border border-gray-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  variant === "danger"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : variant === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-blue-200 bg-blue-50 text-blue-600"
                }`}
              >
                {variant === "danger" ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 leading-6">{finalTitle}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
                {variant === "danger" && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Tindakan ini permanen dan tidak dapat dibatalkan.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="btn btn-secondary text-xs sm:text-sm py-2 px-3.5"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirm}
                className={`btn text-xs sm:text-sm py-2 px-3.5 inline-flex items-center justify-center gap-1.5 ${
                  variant === "danger" ? "btn-danger" : "btn-primary"
                }`}
              >
                {loading && (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? finalLoadingText : finalConfirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className}
        disabled={disabled}
        title={titleAttr}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {modal}
    </>
  );
}
