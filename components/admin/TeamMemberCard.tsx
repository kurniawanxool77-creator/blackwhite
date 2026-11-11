import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AttendanceStatus } from "@/lib/attendance";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  phone: string | null;
  image: string | null;
  duties: string;
};

// Nomor Indonesia untuk wa.me: 08xx → 628xx, hanya angka.
export const waNumber = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0/, "62");

const TONE = {
  green: "border-green-200 bg-green-50 text-green-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  gray: "border-gray-200 bg-gray-50 text-gray-700",
};

// Kartu anggota tim: foto, nama (ke halaman detail), jabatan, status absensi hari ini, tugas, dan kontak.
export function TeamMemberCard({ member, isMe, href, status }: { member: Member; isMe: boolean; href: string; status?: AttendanceStatus }) {
  const duties = member.duties ? member.duties.split("\n") : [];
  return (
    <article className={`card flex flex-col p-4 ${isMe ? "border-brand/40" : ""}`}>
      <div className="flex items-start gap-3">
        <UserAvatar name={member.name} image={member.image} size={56} />
        <div className="min-w-0 flex-1">
          <Link href={href} className="font-semibold text-gray-900 hover:text-brand hover:underline">
            {member.name}
          </Link>
          {isMe && <span className="ml-1.5 text-xs font-medium text-gray-500">(Anda)</span>}
          <p className="text-sm text-gray-600">{member.position || (member.role === "superadmin" ? "Superadmin" : "Panitia")}</p>
          {status && <span className={`mt-1 inline-block rounded border px-2 py-0.5 text-xs font-semibold ${TONE[status.tone]}`}>{status.label}</span>}
        </div>
      </div>

      {duties.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Tugas</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-700">
            {duties.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-3 text-sm">
        {member.phone ? (
          <>
            <a href={`tel:${member.phone.replace(/[^\d+]/g, "")}`} className="btn btn-secondary btn-sm">
              <PhoneIcon width={16} height={16} />
              {member.phone}
            </a>
            <a href={`https://wa.me/${waNumber(member.phone)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm border-green-200 bg-green-50 text-green-800 hover:bg-green-100">
              WhatsApp
            </a>
          </>
        ) : (
          <span className="text-xs text-gray-500">No. HP belum diisi</span>
        )}
        <a href={`mailto:${member.email}`} className="btn btn-secondary btn-sm" aria-label={`Email ${member.name}`}>
          <MailIcon width={16} height={16} />
          Email
        </a>
        <Link href={href} className="btn btn-secondary btn-sm">Detail</Link>
      </div>
    </article>
  );
}
