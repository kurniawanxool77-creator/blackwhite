import { notFound } from "next/navigation";
import { Scanner } from "@/components/scanner/Scanner";
import { requireAdmin } from "@/lib/auth";
import { scanEvent } from "@/lib/scan-flow";

export const dynamic = "force-dynamic";

// Layar scan terkunci ke satu item rundown. Item "agenda saja" atau milik event lain: 404.
export default async function ScanRundownPage({ params }: PageProps<"/superadmin/events/[id]/scan/[cpId]">) {
  const admin = await requireAdmin("superadmin");
  const { id, cpId } = await params;
  const event = await scanEvent(admin, id);
  const index = event?.checkpoints.findIndex((c) => c.id === cpId) ?? -1;
  const checkpoint = event?.checkpoints[index];
  if (!event || !checkpoint?.scan) notFound();
  return (
    <Scanner
      checkpoint={{ id: checkpoint.id, name: checkpoint.name, number: index + 1 }}
      eventName={event.name}
      changeHref={`/superadmin/events/${event.id}/scan`}
    />
  );
}
