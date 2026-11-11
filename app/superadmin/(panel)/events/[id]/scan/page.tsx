import { notFound } from "next/navigation";
import { RundownPicker } from "@/components/scanner/RundownPicker";
import { requireAdmin } from "@/lib/auth";
import { scanEvent } from "@/lib/scan-flow";

export const dynamic = "force-dynamic";

export default async function PickRundownPage({ params }: PageProps<"/superadmin/events/[id]/scan">) {
  const admin = await requireAdmin("superadmin");
  const event = await scanEvent(admin, (await params).id);
  if (!event) notFound();
  return <RundownPicker event={event} base="/superadmin" />;
}
