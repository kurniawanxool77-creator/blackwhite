import { useParams } from "react-router-dom";
import { DutyGate } from "@/components/admin/DutyGate";
import { Scanner } from "@/components/scanner/Scanner";
import type { scanEvent } from "@/lib/scan-flow";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type ScanCheckpointPayload = {
  event: NonNullable<Awaited<ReturnType<typeof scanEvent>>>;
  checkpoint: { id: string; name: string; kind: string; scan: boolean; number: number };
  onDuty: boolean;
};

export function EventScanCheckpointPage({ base }: { base: "/admin" | "/superadmin" }) {
  const { id, cpId } = useParams();
  const state = useApiData<ScanCheckpointPayload>(
    id && cpId ? `/api/admin/events/${encodeURIComponent(id)}/scan/${encodeURIComponent(cpId)}` : null,
  );

  return (
    <DataGate state={state} notFoundTitle="Pos scan tidak ditemukan" backTo={`${base}/scan`}>
      {({ event, checkpoint, onDuty }) =>
        base === "/admin" && !onDuty ? (
          <DutyGate event={event} backHref={`${base}/events/${event.id}/scan`} />
        ) : (
          <Scanner
            checkpoint={checkpoint}
            eventName={event.name}
            changeHref={`${base}/events/${event.id}/scan`}
          />
        )
      }
    </DataGate>
  );
}

