import type { FormState } from "@/lib/form";
import { callRpc, rpcForm } from "../rpc";

export const createAdmin = (_prev: string | null, f: FormData) => rpcForm<string | null>("createAdmin", f);
export const setAdminEvents = (adminId: string, f: FormData) => rpcForm<void>("setAdminEvents", f, adminId);
export const deleteAdmin = async (adminId: string): Promise<void> => { await callRpc("deleteAdmin", adminId); };
export const toggleAdmin = async (adminId: string): Promise<void> => { await callRpc("toggleAdmin", adminId); };
export const resetAdminPassword = (adminId: string, _prev: FormState | null, f: FormData) => rpcForm<FormState>("resetAdminPassword", f, adminId);
export const updateTeamProfile = (adminId: string, _prev: FormState | null, f: FormData) => rpcForm<FormState>("updateTeamProfile", f, adminId);

export const createCategory = (_prev: string | null, f: FormData) => rpcForm<string | null>("createCategory", f);
export const updateCategory = (id: string, f: FormData) => rpcForm<string | null>("updateCategory", f, id);
export const deleteCategory = async (id: string): Promise<void> => { await callRpc("deleteCategory", id); };

export const createUser = (_prev: unknown, f: FormData) => rpcForm<void>("createUser", f);
export const updateUser = (userId: string, _prev: unknown, f: FormData) => rpcForm<void>("updateUser", f, userId);

export const saveArticle = (id: string | null, _prev: string | null, f: FormData) => rpcForm<string | null>("saveArticle", f, id ?? "null");
export const deleteArticle = async (id: string): Promise<void> => { await callRpc("deleteArticle", id); };

export const createBanner = (_prev: string | null, f: FormData) => rpcForm<string | null>("createBanner", f);
export const updateBanner = (id: string, _prev: string | null, f: FormData) => rpcForm<string | null>("updateBanner", f, id);
export const toggleBanner = async (id: string): Promise<void> => { await callRpc("toggleBanner", id); };
export const moveBanner = async (id: string, direction: "up" | "down"): Promise<void> => { await callRpc("moveBanner", id, direction); };
export const deleteBanner = async (id: string): Promise<void> => { await callRpc("deleteBanner", id); };

export const createTransaction = (_prev: string | null, f: FormData) => rpcForm<string | null>("createTransaction", f);
export const updateTransaction = (id: string, _prev: string | null, f: FormData) => rpcForm<string | null>("updateTransaction", f, id);
export const deleteTransaction = async (id: string): Promise<void> => { await callRpc("deleteTransaction", id); };

export const saveSite = (_prev: string | null, f: FormData) => rpcForm<string | null>("saveSite", f);
