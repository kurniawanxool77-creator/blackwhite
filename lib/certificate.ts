export function certificateStatus(input: {
  certificate: boolean;
  status: string;
  questions: number;
  passed: boolean;
  scans: number;
  needsAttendance: boolean;
  videos?: { total: number; done: number };
}): { eligible: boolean; reason: string } {
  if (!input.certificate) return { eligible: false, reason: "Event ini tidak memberikan sertifikat." };
  if (input.status !== "approved") return { eligible: false, reason: "Pendaftaran belum disetujui." };
  if (input.videos && input.videos.done < input.videos.total) return { eligible: false, reason: `Selesaikan semua video (${input.videos.done}/${input.videos.total}).` };
  if (input.needsAttendance && input.scans === 0) return { eligible: false, reason: "Belum tercatat hadir di event." };
  if (input.questions > 0 && !input.passed) return { eligible: false, reason: "Selesaikan dan lulus kuis untuk mendapat sertifikat." };
  return { eligible: true, reason: "Memenuhi syarat sertifikat." };
}

export function parseOptions(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

