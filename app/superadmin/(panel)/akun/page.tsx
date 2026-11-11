import { AdminAccount } from "@/components/admin/AdminAccount";
import { requireAdmin } from "@/lib/auth";

export default async function AccountPage() {
  return <AdminAccount admin={await requireAdmin("superadmin")} />;
}
