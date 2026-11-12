import type { FormState } from "@/lib/form";
import { rpcFormMessage, rpcFormState } from "../rpc";

export async function registerUser(_prev: FormState | null, f: FormData): Promise<FormState | null> {
  return rpcFormState("registerUser", f);
}

export async function registerForEvent(eventId: string, _prev: string | null, f: FormData): Promise<string | null> {
  return rpcFormMessage("registerForEvent", f, eventId);
}

