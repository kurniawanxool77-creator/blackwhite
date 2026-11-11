import { CalendarIcon } from "./icons";

// Pengganti foto agar tinggi kartu tetap sama bila event atau artikel belum punya foto.
export function PhotoPlaceholder() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-gray-400" aria-hidden>
      <CalendarIcon width={36} height={36} />
    </div>
  );
}
