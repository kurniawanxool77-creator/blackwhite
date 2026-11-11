import { notFound } from "next/navigation";
import { MemberProfile } from "@/components/admin/MemberProfile";
import { requireAdmin } from "@/lib/auth";
import { getMemberDetail } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: PageProps<"/admin/tim/[id]">) {
  const viewer = await requireAdmin("scanner");
  const detail = await getMemberDetail((await params).id, viewer);
  if (!detail) notFound();
  return <MemberProfile detail={detail} backHref="/admin/tim" isMe={detail.member.id === viewer.id} />;
}
