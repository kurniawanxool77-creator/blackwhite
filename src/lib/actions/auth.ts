import type { FormState } from "@/lib/form";
import { rpcForm } from "../rpc";

export async function registerUser(_prev: FormState | null, f: FormData): Promise<FormState | null> {
  return rpcForm<FormState | null>("registerUser", f);
}

export async function registerForEvent(eventId: string, _prev: string | null, f: FormData): Promise<string | null> {
  return rpcForm<string | null>("registerForEvent", f, eventId);
}

