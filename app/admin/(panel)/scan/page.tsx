import { ScanScreen } from "@/components/scanner/ScanScreen";
import { requireAdmin } from "@/lib/auth";

export default async function AdminScanPage() {
  return <ScanScreen admin={await requireAdmin("scanner")} />;
}
