import { AttendanceHistory } from "@/components/admin/AttendanceHistory";
import { AttendancePanel, type AttendanceTodayProps } from "@/components/admin/AttendancePanel";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type AttendanceRow = {
  id: string;
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  event: { name: string };
};

export function AdminAttendancePage() {
  const state = useApiData<{ attendanceToday: AttendanceTodayProps; rows: AttendanceRow[] }>("/api/admin/attendance");

  return (
    <DataGate state={state}>
      {({ attendanceToday, rows }) => (
        <div className="space-y-6">
          <PageHeader title="Absensi petugas" description="Absen datang dan selesai bertugas dengan foto selfie di hari acara berlangsung." />
          <AttendancePanel date={attendanceToday.date} items={attendanceToday.items} />
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Riwayat absensi Anda</h2>
            <AttendanceHistory rows={rows} />
          </section>
        </div>
      )}
    </DataGate>
  );
}

