import { notFound } from "next/navigation";
import { DutyGate } from "@/components/admin/DutyGate";
import { RundownPicker } from "@/components/scanner/RundownPicker";
import { isOnDuty } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { scanEvent } from "@/lib/scan-flow";

export const dynamic = "force-dynamic";

export default async function PickRundownPage({ params }: PageProps<"/admin/events/[id]/scan">) {
  const admin = await requireAdmin("scanner");
  const event = await scanEvent(admin, (await params).id);
  if (!event) notFound();
  if (!(await isOnDuty(admin.id, event.id))) return <DutyGate event={event} backHref={`/admin/events/${event.id}`} />;
  return <RundownPicker event={event} base="/admin" />;
}
