import { ScanScreen } from "@/components/scanner/ScanScreen";
import type { scanEvents } from "@/lib/scan-flow";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type ScanListPayload = {
  events: Awaited<ReturnType<typeof scanEvents>>;
  role: string;
};

export function ScanScreenPage() {
  const state = useApiData<ScanListPayload>("/api/admin/scan");

  return (
    <DataGate state={state}>
      {({ events, role }) => <ScanScreen events={events} role={role} />}
    </DataGate>
  );
}

