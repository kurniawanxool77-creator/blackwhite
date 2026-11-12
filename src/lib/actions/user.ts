import type { FormState } from "@/lib/form";
import { callRpc, errorMessage, rpcForm, rpcFormState } from "../rpc";

export type QuizResult = {
  correct: number;
  total: number;
  score: number;
  passed: boolean;
  certificateNo: string | null;
  message?: string;
} | null;

export async function updateProfile(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcFormState("updateProfile", f);
}

export async function cancelRegistration(registrationId: string) {
  return callRpc("cancelRegistration", registrationId);
}

export async function changeUserPassword(_prev: FormState | null, f: FormData): Promise<FormState> {
  return rpcFormState("changeUserPassword", f);
}

export async function markLessonDone(registrationId: string, lessonId: string): Promise<{ ok: boolean; message?: string; certificateNo?: string | null }> {
  return callRpc("markLessonDone", { registrationId, lessonId });
}

export async function submitQuiz(registrationId: string, _prev: QuizResult, f: FormData): Promise<QuizResult> {
  try {
    return await rpcForm<QuizResult>("submitQuiz", f, registrationId);
  } catch (err) {
    return { correct: 0, total: 0, score: 0, passed: false, certificateNo: null, message: errorMessage(err) };
  }
}

