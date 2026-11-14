import { useParams } from "react-router-dom";
import { RundownPicker } from "@/components/scanner/RundownPicker";
import type { scanEvent } from "@/lib/scan-flow";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type ScanPickPayload = {
  event: NonNullable<Awaited<ReturnType<typeof scanEvent>>>;
  onDuty: boolean;
};

export function EventScanPickPage({ base }: { base: "/admin" | "/superadmin" }) {
  const { id } = useParams();
  const state = useApiData<ScanPickPayload>(id ? `/api/admin/events/${encodeURIComponent(id)}/scan` : null);

  return (
    <DataGate state={state} notFoundTitle="Event tidak ditemukan" backTo={`${base}/scan`}>
      {({ event, onDuty: _onDuty }) =>
        <RundownPicker event={event} base={base} />
      }
    </DataGate>
  );
}

