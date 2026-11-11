import { db } from "./db";

// Mencatat tindakan Superadmin yang mengubah data penting. Gagal mencatat tidak boleh menggagalkan tindakannya.
export async function audit(admin: { id: string; name: string }, action: string, detail = "") {
  await db.auditLog.create({ data: { adminId: admin.id, adminName: admin.name, action, detail } }).catch(() => {});
}
