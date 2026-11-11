import { callRpc, rpcForm } from "../rpc";

export const createEvent = (_prev: string | null, f: FormData) => rpcForm<string | null>("createEvent", f);
export const updateEvent = (eventId: string, _prev: string | null, f: FormData) => rpcForm<string | null>("updateEvent", f, eventId);
export const saveFormFields = (eventId: string, _prev: string | null, f: FormData) => rpcForm<string | null>("saveFormFields", f, eventId);
export const setEventAdmins = (eventId: string, f: FormData) => rpcForm<void>("setEventAdmins", f, eventId);
export const setEventStatus = (eventId: string, f: FormData) => rpcForm<void>("setEventStatus", f, eventId);
export const deleteEvent = async (eventId: string): Promise<void> => { await callRpc("deleteEvent", eventId); };

export const sortRundown = async (eventId: string): Promise<void> => { await callRpc("sortRundown", eventId); };
export const addCheckpoint = (eventId: string, f: FormData) => rpcForm<void>("addCheckpoint", f, eventId);
export const updateCheckpoint = (id: string, f: FormData) => rpcForm<string | null>("updateCheckpoint", f, id);
export const moveCheckpoint = async (id: string, direction: "up" | "down"): Promise<void> => { await callRpc("moveCheckpoint", id, direction); };
export const deleteCheckpoint = async (id: string): Promise<void> => { await callRpc("deleteCheckpoint", id); };
export const setCheckpointAudience = (id: string, f: FormData) => rpcForm<void>("setCheckpointAudience", f, id);
export const toggleCheckpointScan = async (id: string): Promise<void> => { await callRpc("toggleCheckpointScan", id); };

export const addShuttle = (eventId: string, f: FormData) => rpcForm<string | null>("addShuttle", f, eventId);
export const updateShuttle = (id: string, f: FormData) => rpcForm<string | null>("updateShuttle", f, id);
export const deleteShuttle = async (id: string): Promise<void> => { await callRpc("deleteShuttle", id); };

export const saveLearningSettings = (eventId: string, f: FormData) => rpcForm<void>("saveLearningSettings", f, eventId);
export const addLesson = (eventId: string, _prev: string | null, f: FormData) => rpcForm<string | null>("addLesson", f, eventId);
export const updateLesson = (id: string, _prev: string | null, f: FormData) => rpcForm<string | null>("updateLesson", f, id);
export const deleteLesson = async (id: string): Promise<void> => { await callRpc("deleteLesson", id); };
export const moveLesson = async (id: string, direction: "up" | "down"): Promise<void> => { await callRpc("moveLesson", id, direction); };

export const addQuestion = (eventId: string, _prev: string | null, f: FormData) => rpcForm<string | null>("addQuestion", f, eventId);
export const updateQuestion = (id: string, _prev: string | null, f: FormData) => rpcForm<string | null>("updateQuestion", f, id);
export const deleteQuestion = async (id: string): Promise<void> => { await callRpc("deleteQuestion", id); };
export const moveQuestion = async (id: string, direction: "up" | "down"): Promise<void> => { await callRpc("moveQuestion", id, direction); };

export const issueOne = async (registrationId: string): Promise<void> => { await callRpc("issueOne", registrationId); };
export const revokeCertificate = async (registrationId: string): Promise<void> => { await callRpc("revokeCertificate", registrationId); };
export const issueAllEligible = async (eventId: string): Promise<void> => { await callRpc("issueAllEligible", eventId); };

export const approveRegistrations = async (eventId: string, ids: string[] | null): Promise<void> => { await callRpc("approveRegistrations", eventId, ids); };
export const importParticipants = (eventId: string, _prev: string | null, f: FormData) => rpcForm<string | null>("importParticipants", f, eventId);
export const deleteRegistration = async (id: string): Promise<void> => { await callRpc("deleteRegistration", id); };
export const deleteUser = async (userId: string): Promise<void> => { await callRpc("deleteUser", userId); };
export const rejectRegistration = (id: string, f: FormData) => rpcForm<void>("rejectRegistration", f, id);
