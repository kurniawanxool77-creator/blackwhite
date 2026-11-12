"use client";

// Tombol submit yang meminta konfirmasi dulu. Dipakai di form server action untuk tindakan yang sulit dibatalkan.
export function ConfirmSubmit({ message, className, disabled, children }: { message: string; className?: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      className={className}
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
