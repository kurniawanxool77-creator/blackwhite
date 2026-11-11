export type Role = "user" | "scanner" | "superadmin";

// Halaman awal per peran. "scanner" = admin/panitia.
export const HOME: Record<string, string> = {
  superadmin: "/superadmin/dashboard",
  scanner: "/admin/dashboard",
  user: "/dashboard",
};

export const ROLE_LABEL: Record<string, string> = { superadmin: "Superadmin", scanner: "Panitia" };


