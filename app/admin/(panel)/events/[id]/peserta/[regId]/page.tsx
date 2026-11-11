import { notFound } from "next/navigation";
import { ParticipantDetail } from "@/components/admin/ParticipantDetail";
import { isOnDuty } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { getParticipant } from "@/lib/participant";

export default async function PanitiaParticipantPage({ params }: PageProps<"/admin/events/[id]/peserta/[regId]">) {
  const admin = await requireAdmin("scanner");
  const { id, regId } = await params;
  const reg = await getParticipant(id, regId, admin.id);
  if (!reg) notFound();
  const locked = !(await isOnDuty(admin.id, id));
  return <ParticipantDetail reg={reg} admin={admin} backHref={`/admin/events/${id}`} locked={locked} />;
}
