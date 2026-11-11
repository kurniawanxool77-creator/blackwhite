import { notFound } from "next/navigation";
import { MemberProfile } from "@/components/admin/MemberProfile";
import { requireAdmin } from "@/lib/auth";
import { getMemberDetail } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: PageProps<"/superadmin/tim/[id]">) {
  const viewer = await requireAdmin("superadmin");
  const detail = await getMemberDetail((await params).id, viewer);
  if (!detail) notFound();
  return <MemberProfile detail={detail} backHref="/superadmin/absensi" isMe={detail.member.id === viewer.id} />;
}
