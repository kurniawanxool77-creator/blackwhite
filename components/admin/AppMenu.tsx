import Link from "next/link";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";

// Menu Home panitia ala layar aplikasi Android: ikon kotak + judul pendek, tanpa paragraf.
const ITEMS = [
  { href: "/admin/absensi", label: "Absensi", Icon: CheckCircleIcon },
  { href: "/admin/events", label: "Event", Icon: CalendarIcon },
  { href: "/admin/riwayat", label: "Riwayat", Icon: ClockIcon },
  { href: "/admin/tim", label: "Tim", Icon: UsersIcon },
  { href: "/admin/materi", label: "Materi", Icon: DocumentIcon },
  { href: "/admin/darurat", label: "Darurat", Icon: ShieldCheckIcon, danger: true },
  { href: "/admin/akun", label: "Profil", Icon: UserIcon },
];

export function AppMenu() {
  return (
    <nav aria-label="Menu panitia" className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-7">
      {ITEMS.map(({ href, label, Icon, danger }) => (
        <Link key={href} href={href} className="group flex flex-col items-center gap-1.5 rounded-md py-1 text-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-md shadow-sm transition-transform group-active:scale-95 ${
              danger ? "bg-red-600 text-white" : "bg-brand text-white"
            }`}
          >
            <Icon width={26} height={26} />
          </span>
          <span className="text-xs font-medium text-gray-800">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
