import type { Admin } from "@prisma/client";
import { AdminAccount } from "@/components/admin/AdminAccount";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function StaffAccountPage() {
  const state = useApiData<{ admin: Admin }>("/api/admin/account");

  return (
    <DataGate state={state} notFoundTitle="Akun tidak ditemukan" backTo="/">
      {({ admin }) => <AdminAccount admin={admin} />}
    </DataGate>
  );
}

