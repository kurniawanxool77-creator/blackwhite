import { useParams } from "react-router-dom";
import { MemberProfile } from "@/components/admin/MemberProfile";
import type { MemberDetail } from "@/lib/team";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

export function TeamMemberPage({ backHref }: { backHref: string }) {
  const { id } = useParams();
  const { user } = useAuth();
  const state = useApiData<{ detail: MemberDetail }>(id ? `/api/admin/tim/${encodeURIComponent(id)}` : null);

  return (
    <DataGate state={state} notFoundTitle="Anggota tidak ditemukan" backTo={backHref}>
      {({ detail }) => (
        <MemberProfile
          detail={detail}
          backHref={backHref}
          isMe={detail.member.id === user?.id}
        />
      )}
    </DataGate>
  );
}

