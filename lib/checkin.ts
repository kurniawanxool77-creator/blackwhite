// Aturan bersama untuk check-in (dipakai server action dan tampilan).

export const UNDO_MINUTES = 15;

// Superadmin boleh membatalkan scan apa pun. Panitia hanya scan miliknya sendiri, maks. UNDO_MINUTES setelah dipindai.
export function canUndoScan(admin: { id: string; role: string }, scan: { adminId: string; createdAt: Date }) {
  if (admin.role === "superadmin") return true;
  return scan.adminId === admin.id && Date.now() - scan.createdAt.getTime() < UNDO_MINUTES * 60_000;
}

// Awal hari ini di zona Asia/Jakarta (UTC+7), untuk statistik "hari ini".
export function startOfTodayJakarta() {
  const offset = 7 * 3_600_000;
  const local = new Date(Date.now() + offset);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset);
}

// Tanggal hari ini (YYYY-MM-DD) di Asia/Jakarta. Tanggal event disimpan sebagai tengah malam UTC dari tanggal kalendernya.
export const todayKeyJakarta = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

// Event sedang berlangsung: status aktif dan hari ini di antara tanggal mulai dan selesai (inklusif).
export function isRunning(e?: { startDate: Date; endDate: Date; status?: string }) {
  if (!e) return false;
  if (e.status === "draft" || e.status === "done" || e.status === "closed") return false;
  const today = todayKeyJakarta();
  const start = new Date(e.startDate).toISOString().slice(0, 10);
  const end = new Date(e.endDate).toISOString().slice(0, 10);
  return today >= start && today <= end;
}

// Sapaan sesuai jam di Jakarta.
export function greetingJakarta() {
  const hour = new Date(Date.now() + 7 * 3_600_000).getUTCHours();
  if (hour >= 4 && hour < 11) return "selamat pagi";
  if (hour >= 11 && hour < 15) return "selamat siang";
  if (hour >= 15 && hour < 18) return "selamat sore";
  return "selamat malam";
}
