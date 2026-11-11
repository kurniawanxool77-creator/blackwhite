import { useParams } from "react-router-dom";
import { ParticipantDetail } from "@/components/admin/ParticipantDetail";
import type { Participant } from "@/lib/participant";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

type ParticipantPayload = {
  reg: Participant;
  locked: boolean;
};

export function EventParticipantPage({ base }: { base: "/admin" | "/superadmin" }) {
  const { id, regId } = useParams();
  const { user } = useAuth();
  const state = useApiData<ParticipantPayload>(
    id && regId ? `/api/admin/events/${encodeURIComponent(id)}/participant/${encodeURIComponent(regId)}` : null,
  );

  return (
    <DataGate state={state} notFoundTitle="Peserta tidak ditemukan" backTo={`${base}/events/${id ?? ""}`}>
      {({ reg, locked }) => (
        <ParticipantDetail
          reg={reg}
          admin={{ id: user?.id ?? "", role: user?.role ?? "scanner" }}
          backHref={`${base}/events/${id ?? reg.eventId}`}
          locked={base === "/admin" ? locked : false}
        />
      )}
    </DataGate>
  );
}

