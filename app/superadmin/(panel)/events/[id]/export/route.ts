import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime, REG_STATUS } from "@/lib/format";
import { parseFields, readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";

// Kutip bila perlu, dan netralkan rumus agar aman dibuka di Excel.
const cell = (v: string) => {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(_req: Request, ctx: RouteContext<"/superadmin/events/[id]/export">) {
  await requireAdmin("superadmin");
  const { id } = await ctx.params;
  const event = await db.event.findUnique({
    where: { id },
    include: {
      checkpoints: { where: { scan: true }, orderBy: { order: "asc" } },
      registrations: { include: { user: true, scans: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) return new Response("Event tidak ditemukan", { status: 404 });

  // Kolom jawaban mengikuti isian formulir saat ini (dicocokkan per id isian).
  const fields = parseFields(event.formFields);
  const header = ["No. peserta", "Nama", "Email", "No. HP", "Instansi", "Status", ...fields.map((f) => f.label), "Total biaya", "No. referensi", ...event.checkpoints.map((c) => c.name)];
  const rows = event.registrations.map((r) => {
    const at = new Map(r.scans.map((s) => [s.checkpointId, s.createdAt]));
    const d = readDetails(r.details);
    const answer = new Map(d.answers.map((a) => [a.id, a.value]));
    return [
      r.code ?? "",
      r.user.name,
      r.user.email,
      r.user.phone ?? "",
      r.user.organization ?? "",
      REG_STATUS[r.status],
      ...fields.map((f) => answer.get(f.id) ?? ""),
      d.total != null ? String(d.total) : "",
      d.paymentProof,
      ...event.checkpoints.map((c) => {
        if (!appliesTo(c, d)) return "-"; // bukan rundown peserta ini
        const t = at.get(c.id);
        return t ? fmtDateTime(t) : "";
      }),
    ];
  });
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.csv"`,
    },
  });
}
