import { notFound } from "next/navigation";
import { ParticipantDetail } from "@/components/admin/ParticipantDetail";
import { requireAdmin } from "@/lib/auth";
import { getParticipant } from "@/lib/participant";

export default async function SuperadminParticipantPage({ params }: PageProps<"/superadmin/events/[id]/peserta/[regId]">) {
  const admin = await requireAdmin("superadmin");
  const { id, regId } = await params;
  const reg = await getParticipant(id, regId);
  if (!reg) notFound();
  return <ParticipantDetail reg={reg} admin={admin} backHref={`/superadmin/events/${id}`} />;
}
