"use client";

// Tombol submit yang meminta konfirmasi dulu. Dipakai di form server action untuk tindakan yang sulit dibatalkan.
export function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
