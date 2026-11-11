import type { FormState } from "@/lib/form";
import { callRpc, rpcForm } from "../rpc";

export type QuizResult = {
  correct: number;
  total: number;
  score: number;
  passed: boolean;
  certificateNo: string | null;
  message?: string;
} | null;

export async function updateProfile(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcForm<FormState>("updateProfile", f);
}

export async function cancelRegistration(registrationId: string) {
  return callRpc("cancelRegistration", registrationId);
}

export async function changeUserPassword(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcForm<FormState>("changeUserPassword", f);
}

export async function markLessonDone(registrationId: string, lessonId: string): Promise<{ ok: boolean; message?: string; certificateNo?: string | null }> {
  return callRpc("markLessonDone", { registrationId, lessonId });
}

export async function submitQuiz(registrationId: string, _prev: QuizResult, f: FormData): Promise<QuizResult> {
  return rpcForm<QuizResult>("submitQuiz", f, registrationId);
}

