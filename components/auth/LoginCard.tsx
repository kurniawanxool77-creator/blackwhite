import Link from "next/link";
import { AdminLoginForm } from "./AdminLoginForm";

// Halaman login panitia tidak menautkan ke superadmin; alamat superadmin hanya diketahui pemiliknya.
const COPY = {
  superadmin: { title: "Login superadmin", hint: "Pengelola event, peserta, halaman depan, dan artikel.", other: { href: "/admin", label: "Login panitia" } },
  admin: { title: "Login panitia", hint: "Untuk panitia yang absen dan memindai QR di event yang ditugaskan.", other: null },
};

export function LoginCard({ portal, siteName }: { portal: "superadmin" | "admin"; siteName: string }) {
  const copy = COPY[portal];
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20">
      <div className="card p-6">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase">{siteName}</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">{copy.title}</h1>
        <p className="mt-1 mb-6 text-sm text-gray-600">{copy.hint}</p>
        <AdminLoginForm portal={portal} />
      </div>
      <p className="mt-4 text-center text-sm text-gray-600">
        {copy.other && (
          <>
            <Link href={copy.other.href} className="hover:text-brand">{copy.other.label}</Link>
            {" · "}
          </>
        )}
        <Link href="/login" className="hover:text-brand">Login peserta</Link>
      </p>
    </div>
  );
}
