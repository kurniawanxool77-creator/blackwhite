import { useParams } from "react-router-dom";
import { DutyGate } from "@/components/admin/DutyGate";
import { Scanner, type RecentScanItem } from "@/components/scanner/Scanner";
import type { RosterItem } from "@/components/scanner/ScannerRosterList";
import type { scanEvent } from "@/lib/scan-flow";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type ScanCheckpointPayload = {
  event: NonNullable<Awaited<ReturnType<typeof scanEvent>>>;
  checkpoint: { id: string; name: string; kind: string; scan: boolean; number: number };
  onDuty: boolean;
  scannedCount?: number;
  totalEligible?: number;
  roster?: RosterItem[];
  recent?: RecentScanItem[];
  serverTime?: string;
};

export function EventScanCheckpointPage({ base }: { base: "/admin" | "/superadmin" }) {
  const { id, cpId } = useParams();
  const state = useApiData<ScanCheckpointPayload>(
    id && cpId ? `/api/admin/events/${encodeURIComponent(id)}/scan/${encodeURIComponent(cpId)}` : null,
  );

  return (
    <DataGate state={state} notFoundTitle="Pos scan tidak ditemukan" backTo={`${base}/scan`}>
      {({ event, checkpoint, onDuty, roster, recent, serverTime }) =>
        base === "/admin" && !onDuty ? (
          <DutyGate event={event} backHref={`${base}/events/${event.id}/scan`} />
        ) : (
          <Scanner
            eventId={event.id}
            checkpoint={checkpoint}
            eventName={event.name}
            changeHref={`${base}/events/${event.id}/scan`}
            initialRoster={roster}
            initialRecent={recent}
            initialServerTime={serverTime}
          />
        )
      }
    </DataGate>
  );
}

