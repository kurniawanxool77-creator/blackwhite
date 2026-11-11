import { notFound } from "next/navigation";
import { DutyGate } from "@/components/admin/DutyGate";
import { Scanner } from "@/components/scanner/Scanner";
import { isOnDuty } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { scanEvent } from "@/lib/scan-flow";

export const dynamic = "force-dynamic";

// Layar scan terkunci ke satu item rundown. Item "agenda saja" atau milik event lain: 404.
export default async function ScanRundownPage({ params }: PageProps<"/admin/events/[id]/scan/[cpId]">) {
  const admin = await requireAdmin("scanner");
  const { id, cpId } = await params;
  const event = await scanEvent(admin, id);
  const index = event?.checkpoints.findIndex((c) => c.id === cpId) ?? -1;
  const checkpoint = event?.checkpoints[index];
  if (!event || !checkpoint?.scan) notFound();
  if (!(await isOnDuty(admin.id, event.id))) return <DutyGate event={event} backHref={`/admin/events/${event.id}`} />;
  return (
    <Scanner
      checkpoint={{ id: checkpoint.id, name: checkpoint.name, number: index + 1 }}
      eventName={event.name}
      changeHref={`/admin/events/${event.id}/scan`}
    />
  );
}
