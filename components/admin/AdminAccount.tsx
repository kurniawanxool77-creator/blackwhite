import type { Admin } from "@prisma/client";
import { SignOutButton } from "@/components/auth/AuthButtons";
import { DownloadIcon } from "@/components/ui/icons";
import { fmtDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { AvatarUpload } from "@/components/user/AvatarUpload";
import { ContactForm } from "./ContactForm";
import { PasswordForm } from "./PasswordForm";

// Halaman profil & akun untuk panitia dan superadmin: identitas, WebApp PWA, + ganti password.
export function AdminAccount({ admin }: { admin: Admin }) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Profil & Akun Panitia</h1>
        <p className="text-xs text-gray-600">Kelola informasi akun dan pengaturan keamanan WebApp Anda.</p>
      </div>

      <section className="card flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white shadow-xs">
          {admin.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900">{admin.name}</p>
          <p className="text-xs text-gray-600">{admin.email}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{ROLE_LABEL[admin.role]} · Bergabung {fmtDate(admin.createdAt)}</p>
        </div>
        <SignOutButton callbackUrl={admin.role === "superadmin" ? "/superadmin" : "/admin"} />
      </section>

      <section className="card space-y-5 p-5">
        <AvatarUpload name={admin.name} image={admin.image} hint="Tampil di halaman Tim dan di pojok kanan atas, agar peserta dan rekan panitia mengenali Anda." />
        <ContactForm phone={admin.phone} />
        {(admin.position || admin.duties) && (
          <div className="border-t border-gray-100 pt-4 text-sm">
            {admin.position && <p className="font-medium text-gray-900">{admin.position}</p>}
            {admin.duties && (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-700">
                {admin.duties.split("\n").map((d) => <li key={d}>{d}</li>)}
              </ul>
            )}
            <p className="mt-2 text-xs text-gray-500">Jabatan dan tugas diatur Superadmin.</p>
          </div>
        )}
      </section>

      {/* Info WebApp Panitia */}
      <section className="card p-5 space-y-2.5">
        <div className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold text-gray-900">Aplikasi WebApp Panitia Lapangan</h2>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          WebApp ini dapat dipasang (Add to Home Screen) di smartphone Android atau iOS tanpa perlu unduh dari Play Store/App Store. Kamera scanner barcode dapat langsung digunakan secara realtime di setiap pos acara.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Ganti Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
