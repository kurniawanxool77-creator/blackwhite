import { ScanScreen } from "@/components/scanner/ScanScreen";
import { requireAdmin } from "@/lib/auth";

export default async function SuperadminScanPage() {
  return <ScanScreen admin={await requireAdmin("superadmin")} />;
}
