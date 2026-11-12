import type { FormState } from "@/lib/form";
import { callRpc, rpcFormState } from "../rpc";

export type ScanResult = {
  tone: "success" | "warning" | "error";
  title: string;
  detail?: string;
  progress?: string;
  photo?: string | null;
};

export async function changeOwnPassword(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcFormState("changeOwnPassword", f);
}

export async function updateOwnContact(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcFormState("updateOwnContact", f);
}

export async function scanQr(checkpointId: string, token: string): Promise<ScanResult> {
  return callRpc<ScanResult>("scanQr", { checkpointId, token });
}

export async function manualCheckin(registrationId: string, checkpointId: string): Promise<void> {
  await callRpc("manualCheckin", { registrationId, checkpointId });
}

export async function undoScan(scanId: string): Promise<void> {
  await callRpc("undoScan", { scanId });
}

