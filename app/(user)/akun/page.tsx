import Link from "next/link";
import { SignOutButton } from "@/components/auth/AuthButtons";
import { CalendarIcon, CheckCircleIcon, TicketIcon } from "@/components/ui/icons";
import { AvatarUpload } from "@/components/user/AvatarUpload";
import { ProfileForm } from "@/components/user/ProfileForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();
  const user = await db.user.findUnique({ where: { id: session.id } });
  const name = user?.name ?? session.email ?? "";
  const initial = name.charAt(0).toUpperCase() || "P";

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-5">
      {/* 1. Header Identitas Peserta */}
      <div className="card flex items-center gap-4 p-5">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white shadow-xs">
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-gray-900">{name}</h1>
            {user?.emailVerified && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                <CheckCircleIcon className="h-3 w-3" />
                Terverifikasi
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          {(user?.phone || user?.organization) && (
            <p className="mt-1 truncate text-xs font-medium text-gray-700">
              {[user?.phone, user?.organization].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Foto profil: dipakai panitia untuk mencocokkan wajah saat scan */}
      <div className="card p-5">
        <AvatarUpload name={name} image={user?.image ?? null} />
      </div>

      {/* 2. Menu Pintasan Pengguna */}
      <div className="card divide-y divide-gray-100 overflow-hidden">
        <Link
          href="/dashboard"
          className="flex items-center justify-between px-5 py-3.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2.5">
            <TicketIcon className="h-4 w-4 text-brand" />
            <span>Tiket & Status Pendaftaran Saya</span>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
        <Link
          href="/event"
          className="flex items-center justify-between px-5 py-3.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-4 w-4 text-brand" />
            <span>Katalog Agenda & Pelatihan</span>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </div>

      {/* 3. Form Ubah Profil */}
      <section className="card p-5">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900">Data Profil Peserta</h2>
          <p className="text-[11px] text-gray-500">
            Perbarui data diri untuk mempermudah verifikasi dan pencetakan sertifikat acara.
          </p>
        </div>
        <ProfileForm
          name={user?.name ?? ""}
          email={user?.email ?? ""}
          phone={user?.phone ?? ""}
          organization={user?.organization ?? ""}
        />
      </section>

      {/* 4. Keluar */}
      <div className="pt-2">
        <SignOutButton />
      </div>
    </div>
  );
}
